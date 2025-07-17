<?php

namespace Espo\Modules\WhatsappNurture\Jobs;

use Espo\Core\Job\Job;
use Espo\Core\Job\Job\Data;
use Espo\Core\Di;
use Espo\Core\Utils\Log;
use Espo\ORM\EntityManager;

class SendWhatsappNurtureMessage implements Job, Di\EntityManagerAware, Di\ServiceFactoryAware, Di\LogAware
{
    use Di\EntityManagerSetter;
    use Di\ServiceFactorySetter;
    use Di\LogSetter;

    public function run(Data $data): void
    {
        $leadId = $data->get('leadId');
        $userId = $data->get('userId');
        $flowName = $data->get('flowName');
        $stage = $data->get('stage');

        if (!$leadId || !$userId || !$flowName || !$stage) {
            $this->log->error("SendWhatsappNurtureMessage: Missing required data");
            return;
        }

        try {
            // Get the lead
            $lead = $this->entityManager->getEntityById('Lead', $leadId);
            if (!$lead) {
                $this->log->error("SendWhatsappNurtureMessage: Lead not found: {$leadId}");
                return;
            }

            // Check if lead still has valid phone number
            $phoneNumber = $lead->get('phoneNumber');
            if (!$phoneNumber) {
                $this->log->warning("SendWhatsappNurtureMessage: No phone number for lead: {$leadId}");
                return;
            }

            $whatsappService = $this->serviceFactory->create('WhatsappService');
            
            // Get template mapping for this stage
            $templateMapping = $whatsappService->getTemplateMapping($userId, $flowName, $stage);
            if (!$templateMapping) {
                $this->log->warning("SendWhatsappNurtureMessage: No template mapping found for user {$userId}, flow {$flowName}, stage {$stage}");
                return;
            }

            $templateName = $templateMapping->get('templateName');
            $parametersTemplate = $templateMapping->get('parameters') ?: [];
            $imageLink = $templateMapping->get('imageLink');

            // Resolve parameters with lead data
            $parameters = $whatsappService->resolveParameters($parametersTemplate, $lead);

            // Send the message
            $success = $whatsappService->sendTemplateMessage(
                $phoneNumber,
                $userId,
                $templateName,
                $parameters,
                $imageLink
            );

            if ($success) {
                $this->log->info("SendWhatsappNurtureMessage: Sent message to lead {$leadId} for stage {$stage}");
                
                // Schedule next message if there's a next stage
                $whatsappService->scheduleNextMessage($leadId, $userId, $flowName, $stage);
            } else {
                $this->log->error("SendWhatsappNurtureMessage: Failed to send message to lead {$leadId}");
            }

        } catch (\Throwable $e) {
            $this->log->error("SendWhatsappNurtureMessage error: " . $e->getMessage());
        }
    }
}