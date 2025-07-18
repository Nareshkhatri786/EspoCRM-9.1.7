<?php

namespace Espo\Modules\WhatsappNurture\Listeners;

use Espo\Core\Hook\Hook\AfterSave;
use Espo\Core\Di;
use Espo\ORM\Entity;
use Espo\Core\Utils\Log;

class NewOpportunityListener implements AfterSave, Di\ServiceFactoryAware, Di\LogAware
{
    use Di\ServiceFactorySetter;
    use Di\LogSetter;

    public function afterSave(Entity $entity, array $options): void
    {
        if ($entity->getEntityType() !== 'Opportunity') {
            return;
        }

        // Only trigger for new opportunities
        if (!$entity->isNew()) {
            return;
        }

        $assignedUserId = $entity->get('assignedUserId');
        if (!$assignedUserId) {
            return;
        }

        try {
            $whatsappService = $this->serviceFactory->create('WhatsappService');
            
            // Schedule first message in 'newOpportunity' flow
            $whatsappService->scheduleNextMessage(
                $entity->getId(),
                $assignedUserId,
                'newOpportunity',
                'newOpportunity',
                'Opportunity'
            );

            $this->log->info("Triggered WhatsApp nurture flow for new opportunity: " . $entity->getId());

        } catch (\Throwable $e) {
            $this->log->error("NewOpportunityListener error: " . $e->getMessage());
        }
    }
}