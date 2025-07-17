<?php

namespace Espo\Modules\WhatsappNurture\Listeners;

use Espo\Core\Hook\Hook\AfterSave;
use Espo\Core\Di;
use Espo\ORM\Entity;
use Espo\Core\Utils\Log;

class NewLeadListener implements AfterSave, Di\ServiceFactoryAware, Di\LogAware
{
    use Di\ServiceFactorySetter;
    use Di\LogSetter;

    public function afterSave(Entity $entity, array $options): void
    {
        if ($entity->getEntityType() !== 'Lead') {
            return;
        }

        // Only trigger for new leads
        if (!$entity->isNew()) {
            return;
        }

        $assignedUserId = $entity->get('assignedUserId');
        if (!$assignedUserId) {
            return;
        }

        try {
            $whatsappService = $this->serviceFactory->create('WhatsappService');
            
            // Schedule first message in 'newLead' flow
            $whatsappService->scheduleNextMessage(
                $entity->getId(),
                $assignedUserId,
                'newLead',
                'newLead'
            );

            $this->log->info("Triggered WhatsApp nurture flow for new lead: " . $entity->getId());

        } catch (\Throwable $e) {
            $this->log->error("NewLeadListener error: " . $e->getMessage());
        }
    }
}