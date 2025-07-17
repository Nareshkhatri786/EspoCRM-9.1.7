<?php

namespace Espo\Modules\WhatsappNurture\Listeners;

use Espo\Core\Hook\Hook\BeforeSave;
use Espo\Core\Di;
use Espo\ORM\Entity;
use Espo\Core\Utils\Log;

class StageChangeListener implements BeforeSave, Di\ServiceFactoryAware, Di\LogAware
{
    use Di\ServiceFactorySetter;
    use Di\LogSetter;

    public function beforeSave(Entity $entity, array $options): void
    {
        if ($entity->getEntityType() !== 'Lead') {
            return;
        }

        // Only trigger for status changes on existing leads
        if ($entity->isNew() || !$entity->isAttributeChanged('status')) {
            return;
        }

        $assignedUserId = $entity->get('assignedUserId');
        if (!$assignedUserId) {
            return;
        }

        $newStatus = $entity->get('status');
        if (!$newStatus) {
            return;
        }

        try {
            $whatsappService = $this->serviceFactory->create('WhatsappService');
            
            // Map Lead status to nurture flow stage
            $flowStageMap = [
                'New' => 'newLead',
                'Assigned' => 'qualification',
                'In Process' => 'proposal',
                'Converted' => 'won',
                'Dead' => 'lost',
                'Recycled' => 'followUp'
            ];

            $stage = $flowStageMap[$newStatus] ?? null;
            if (!$stage) {
                $this->log->warning("No WhatsApp flow stage mapped for Lead status: {$newStatus}");
                return;
            }

            // Schedule next message in the flow
            $whatsappService->scheduleNextMessage(
                $entity->getId(),
                $assignedUserId,
                'leadNurture', // Default flow name
                $stage
            );

            $this->log->info("Triggered WhatsApp nurture flow for lead status change: " . $entity->getId() . " -> {$stage}");

        } catch (\Throwable $e) {
            $this->log->error("StageChangeListener error: " . $e->getMessage());
        }
    }
}