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
        // Support both old format (leadId) and new format (entityId + entityType) for backward compatibility
        $entityId = $data->get('entityId') ?: $data->get('leadId');
        $entityType = $data->get('entityType') ?: 'Lead';
        $userId = $data->get('userId');
        $flowName = $data->get('flowName');
        $stage = $data->get('stage');

        if (!$entityId || !$userId || !$flowName || !$stage) {
            $this->log->error("SendWhatsappNurtureMessage: Missing required data");
            return;
        }

        try {
            // Get the entity (Lead or Opportunity)
            $entity = $this->entityManager->getEntityById($entityType, $entityId);
            if (!$entity) {
                $this->log->error("SendWhatsappNurtureMessage: {$entityType} not found: {$entityId}");
                return;
            }

            // Check if entity still has valid phone number
            $phoneNumber = $this->getPhoneNumber($entity, $entityType);
            if (!$phoneNumber) {
                $this->log->warning("SendWhatsappNurtureMessage: No phone number for {$entityType}: {$entityId}");
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

            // Resolve parameters with entity data
            $parameters = $whatsappService->resolveParameters($parametersTemplate, $entity);

            // Send the message
            $success = $whatsappService->sendTemplateMessage(
                $phoneNumber,
                $userId,
                $templateName,
                $parameters,
                $imageLink
            );

            if ($success) {
                $this->log->info("SendWhatsappNurtureMessage: Sent message to {$entityType} {$entityId} for stage {$stage}");
                
                // Schedule next message if there's a next stage
                $whatsappService->scheduleNextMessage($entityId, $userId, $flowName, $stage, $entityType);
            } else {
                $this->log->error("SendWhatsappNurtureMessage: Failed to send message to {$entityType} {$entityId}");
            }

        } catch (\Throwable $e) {
            $this->log->error("SendWhatsappNurtureMessage error: " . $e->getMessage());
        }
    }

    /**
     * Get phone number from entity based on type
     *
     * @param object $entity Entity (Lead or Opportunity)
     * @param string $entityType Entity type
     * @return string|null Phone number
     */
    private function getPhoneNumber(object $entity, string $entityType): ?string
    {
        switch ($entityType) {
            case 'Lead':
                return $entity->get('phoneNumber');
            
            case 'Opportunity':
                // For opportunities, try to get phone from contact or account
                $contact = $entity->get('contact');
                if ($contact && $contact->get('phoneNumber')) {
                    return $contact->get('phoneNumber');
                }
                
                $account = $entity->get('account');
                if ($account && $account->get('phoneNumber')) {
                    return $account->get('phoneNumber');
                }
                
                // If no direct contact/account, try to load them
                if ($entity->get('contactId')) {
                    $contactEntity = $this->entityManager->getEntityById('Contact', $entity->get('contactId'));
                    if ($contactEntity && $contactEntity->get('phoneNumber')) {
                        return $contactEntity->get('phoneNumber');
                    }
                }
                
                if ($entity->get('accountId')) {
                    $accountEntity = $this->entityManager->getEntityById('Account', $entity->get('accountId'));
                    if ($accountEntity && $accountEntity->get('phoneNumber')) {
                        return $accountEntity->get('phoneNumber');
                    }
                }
                
                return null;
            
            default:
                return null;
        }
    }
}