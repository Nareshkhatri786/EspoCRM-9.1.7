<?php

namespace Espo\Modules\WhatsappNurture\Listeners;

use Espo\Core\Hook\Hook\BeforeSave;
use Espo\Core\Di;
use Espo\ORM\Entity;
use Espo\Core\Utils\Log;

class OpportunityStageChangeListener implements BeforeSave, Di\ServiceFactoryAware, Di\LogAware
{
    use Di\ServiceFactorySetter;
    use Di\LogSetter;

    public function beforeSave(Entity $entity, array $options): void
    {
        if ($entity->getEntityType() !== 'Opportunity') {
            return;
        }

        // Only trigger for stage changes on existing opportunities
        if ($entity->isNew() || !$entity->isAttributeChanged('stage')) {
            return;
        }

        $assignedUserId = $entity->get('assignedUserId');
        if (!$assignedUserId) {
            return;
        }

        $newStage = $entity->get('stage');
        if (!$newStage) {
            return;
        }

        try {
            $whatsappService = $this->serviceFactory->create('WhatsappService');
            
            // Map Opportunity stage to nurture flow stage
            $flowStageMap = [
                'Prospecting' => 'prospecting',
                'Qualification' => 'qualification',
                'Proposal' => 'proposal',
                'Negotiation' => 'negotiation',
                'Closed Won' => 'won',
                'Closed Lost' => 'lost'
            ];

            $stage = $flowStageMap[$newStage] ?? null;
            if (!$stage) {
                $this->log->warning("No WhatsApp flow stage mapped for Opportunity stage: {$newStage}");
                return;
            }

            // Schedule next message in the flow
            $whatsappService->scheduleNextMessage(
                $entity->getId(),
                $assignedUserId,
                'opportunityNurture', // Flow name for opportunities
                $stage,
                'Opportunity'
            );

            $this->log->info("Triggered WhatsApp nurture flow for opportunity stage change: " . $entity->getId() . " -> {$stage}");

        } catch (\Throwable $e) {
            $this->log->error("OpportunityStageChangeListener error: " . $e->getMessage());
        }
    }
}