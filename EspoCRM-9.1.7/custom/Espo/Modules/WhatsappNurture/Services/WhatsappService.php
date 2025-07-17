<?php

namespace Espo\Modules\WhatsappNurture\Services;

use Espo\Core\Services\Base;
use Espo\Core\Di;
use Espo\ORM\EntityManager;
use Espo\Core\Utils\Log;
use Espo\Entities\Job;
use Espo\Core\Utils\DateTime as DateTimeUtil;

class WhatsappService extends Base implements
    Di\EntityManagerAware,
    Di\LogAware
{
    use Di\EntityManagerSetter;
    use Di\LogSetter;

    private EntityManager $entityManager;
    private Log $log;

    /**
     * Send WhatsApp template message
     *
     * @param string $to Phone number with country code
     * @param int $userId User ID for credentials lookup
     * @param string $templateName Template name in WhatsApp Business API
     * @param array $parameters Variables to replace in template
     * @param string|null $imageLink Optional header image URL
     * @return bool Success status
     */
    public function sendTemplateMessage(
        string $to,
        int $userId,
        string $templateName,
        array $parameters = [],
        ?string $imageLink = null
    ): bool {
        try {
            // Load user WhatsApp settings
            $userSettings = $this->entityManager
                ->getRDBRepository('WhatsappUserSettings')
                ->where(['userId' => $userId, 'isActive' => true])
                ->findOne();

            if (!$userSettings) {
                $this->log->error("WhatsApp user settings not found for user ID: {$userId}");
                return false;
            }

            $accessToken = $userSettings->get('accessToken');
            $phoneNumberId = $userSettings->get('phoneNumberId');

            // Build message payload
            $payload = [
                'messaging_product' => 'whatsapp',
                'to' => $to,
                'type' => 'template',
                'template' => [
                    'name' => $templateName,
                    'language' => ['code' => 'en']
                ]
            ];

            // Add parameters if provided
            if (!empty($parameters)) {
                $components = [];
                
                // Add header component if image is provided
                if ($imageLink) {
                    $components[] = [
                        'type' => 'header',
                        'parameters' => [
                            [
                                'type' => 'image',
                                'image' => ['link' => $imageLink]
                            ]
                        ]
                    ];
                }

                // Add body parameters
                if (!empty($parameters)) {
                    $bodyParams = [];
                    foreach ($parameters as $value) {
                        $bodyParams[] = [
                            'type' => 'text',
                            'text' => (string) $value
                        ];
                    }
                    
                    $components[] = [
                        'type' => 'body',
                        'parameters' => $bodyParams
                    ];
                }

                $payload['template']['components'] = $components;
            }

            // Make API call using cURL
            $url = "https://app.waofficial.com/api/integration/whatsapp-message/{$phoneNumberId}/messages";
            
            $curl = curl_init();
            curl_setopt_array($curl, [
                CURLOPT_URL => $url,
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_POST => true,
                CURLOPT_POSTFIELDS => json_encode($payload),
                CURLOPT_HTTPHEADER => [
                    'Authorization: Bearer ' . $accessToken,
                    'Content-Type: application/json'
                ],
                CURLOPT_TIMEOUT => 30
            ]);

            $response = curl_exec($curl);
            $statusCode = curl_getinfo($curl, CURLINFO_HTTP_CODE);
            $error = curl_error($curl);
            curl_close($curl);

            if ($error) {
                $this->log->error("WhatsApp cURL error: " . $error);
                return false;
            }
            
            if ($statusCode >= 200 && $statusCode < 300) {
                $this->log->info("WhatsApp message sent successfully to {$to} using template {$templateName}");
                return true;
            } else {
                $this->log->error("WhatsApp API error: {$statusCode} - " . $response);
                return false;
            }

        } catch (\Throwable $e) {
            $this->log->error("WhatsApp service error: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Schedule next message in nurture flow
     *
     * @param int $leadId Lead ID
     * @param int $userId User ID 
     * @param string $flowName Flow name
     * @param string $currentStage Current stage
     * @return bool Success status
     */
    public function scheduleNextMessage(
        int $leadId,
        int $userId,
        string $flowName,
        string $currentStage
    ): bool {
        try {
            // Find the nurture flow
            $flow = $this->entityManager
                ->getRDBRepository('NurtureFlow')
                ->where([
                    'userId' => $userId,
                    'name' => $flowName,
                    'isActive' => true
                ])
                ->findOne();

            if (!$flow) {
                $this->log->warning("Nurture flow '{$flowName}' not found for user {$userId}");
                return false;
            }

            $steps = $flow->get('steps');
            if (!is_array($steps)) {
                $this->log->warning("Invalid steps configuration in flow '{$flowName}'");
                return false;
            }

            // Find current stage in steps and get next one
            $nextStep = null;
            foreach ($steps as $index => $step) {
                if ($step['stage'] === $currentStage) {
                    if (isset($steps[$index + 1])) {
                        $nextStep = $steps[$index + 1];
                    }
                    break;
                }
            }

            if (!$nextStep) {
                $this->log->info("No next step found for stage '{$currentStage}' in flow '{$flowName}'");
                return false;
            }

            // Calculate execution time
            $delayHours = $nextStep['delayHours'] ?? 24;
            $executeAt = new \DateTime();
            $executeAt->add(new \DateInterval('PT' . $delayHours . 'H'));

            // Create scheduled job
            $job = $this->entityManager->getNewEntity('Job');
            $job->set([
                'name' => 'SendWhatsappNurtureMessage',
                'className' => 'Espo\Modules\WhatsappNurture\Jobs\SendWhatsappNurtureMessage',
                'data' => [
                    'leadId' => $leadId,
                    'userId' => $userId,
                    'flowName' => $flowName,
                    'stage' => $nextStep['stage']
                ],
                'executeTime' => $executeAt->format(DateTimeUtil::SYSTEM_DATE_TIME_FORMAT),
                'attempts' => 0,
                'status' => 'Pending'
            ]);

            $this->entityManager->saveEntity($job);

            $this->log->info("Scheduled WhatsApp message for lead {$leadId}, stage '{$nextStep['stage']}' at " . $executeAt->format('Y-m-d H:i:s'));
            
            return true;

        } catch (\Throwable $e) {
            $this->log->error("Schedule message error: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Resolve variable placeholders in parameters
     *
     * @param array $parameters Parameter template with placeholders
     * @param object $lead Lead entity
     * @return array Resolved parameters
     */
    public function resolveParameters(array $parameters, object $lead): array
    {
        $resolved = [];
        
        foreach ($parameters as $key => $value) {
            if (is_string($value)) {
                // Replace placeholders like {{lead.firstName}}
                $resolved[$key] = preg_replace_callback(
                    '/\{\{lead\.(\w+)\}\}/',
                    function ($matches) use ($lead) {
                        $attribute = $matches[1];
                        return $lead->has($attribute) ? (string) $lead->get($attribute) : '';
                    },
                    $value
                );
            } else {
                $resolved[$key] = $value;
            }
        }
        
        return array_values($resolved);
    }

    /**
     * Get template mapping for user, flow and stage
     *
     * @param int $userId User ID
     * @param string $flowName Flow name
     * @param string $stage Stage name
     * @return object|null Template mapping entity
     */
    public function getTemplateMapping(int $userId, string $flowName, string $stage): ?object
    {
        $flow = $this->entityManager
            ->getRDBRepository('NurtureFlow')
            ->where([
                'userId' => $userId,
                'name' => $flowName,
                'isActive' => true
            ])
            ->findOne();

        if (!$flow) {
            return null;
        }

        return $this->entityManager
            ->getRDBRepository('WhatsappTemplateMapping')
            ->where([
                'userId' => $userId,
                'flowId' => $flow->getId(),
                'stage' => $stage,
                'isActive' => true
            ])
            ->findOne();
    }
}