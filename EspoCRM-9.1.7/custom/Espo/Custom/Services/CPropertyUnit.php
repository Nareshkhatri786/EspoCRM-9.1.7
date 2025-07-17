<?php

namespace Espo\Custom\Services;

use Espo\Core\Exceptions\BadRequest;
use Espo\Core\Exceptions\Forbidden;
use Espo\Services\Record;
use Espo\ORM\Entity;

class CPropertyUnit extends Record
{
    public function getEntityType(): string
    {
        return 'CPropertyUnit';
    }

    protected function beforeCreateEntity(Entity $entity, $data)
    {
        parent::beforeCreateEntity($entity, $data);

        // Set default status if not provided
        if (!$entity->get('status')) {
            $entity->set('status', 'Available');
        }

        $this->validateStatusTransition($entity);
    }

    protected function beforeUpdateEntity(Entity $entity, $data)
    {
        parent::beforeUpdateEntity($entity, $data);

        $this->validateStatusTransition($entity);
    }

    private function validateStatusTransition(Entity $entity): void
    {
        $currentStatus = $entity->get('status');
        $user = $this->getUser();

        // Admin role check for restricted status changes
        if ($this->isRestrictedStatusChange($entity, $currentStatus) && !$user->isAdmin()) {
            throw new Forbidden('Only Admin users can change status from Token Received, Booked, or Cancelled back to Available');
        }

        // Validate Hold status requirements
        if ($currentStatus === 'Hold') {
            if (!$entity->get('holdExpiryDate')) {
                throw new BadRequest('Hold Expiry Date is required when status is Hold');
            }

            if (!$entity->get('holdOpportunityId')) {
                throw new BadRequest('Hold Opportunity is required when status is Hold');
            }

            // Check if another unit is already on hold by the same opportunity
            $existingHold = $this->getEntityManager()
                ->getRDBRepository('CPropertyUnit')
                ->where([
                    'holdOpportunityId' => $entity->get('holdOpportunityId'),
                    'status' => 'Hold',
                    'id!=' => $entity->getId()
                ])
                ->findOne();

            if ($existingHold) {
                throw new BadRequest('This opportunity already has another property unit on hold');
            }
        } else {
            // Clear hold-related fields if not on hold
            if ($entity->isAttributeChanged('status') && $entity->getFetched('status') === 'Hold') {
                $entity->set('holdExpiryDate', null);
                $entity->set('holdOpportunityId', null);
            }
        }

        // Set token/booking dates based on status
        if ($currentStatus === 'Token Received' && !$entity->get('tokenDate')) {
            $entity->set('tokenDate', date('Y-m-d'));
        }

        if ($currentStatus === 'Booked' && !$entity->get('bookingDate')) {
            $entity->set('bookingDate', date('Y-m-d'));
        }
    }

    private function isRestrictedStatusChange(Entity $entity, string $newStatus): bool
    {
        if ($newStatus !== 'Available') {
            return false;
        }

        $previousStatus = $entity->getFetched('status');

        return in_array($previousStatus, ['Token Received', 'Booked', 'Cancelled']);
    }

    /**
     * Check for expired holds and update status
     */
    public function processExpiredHolds(): void
    {
        $expiredHolds = $this->getEntityManager()
            ->getRDBRepository('CPropertyUnit')
            ->where([
                'status' => 'Hold',
                'holdExpiryDate<' => date('Y-m-d')
            ])
            ->find();

        foreach ($expiredHolds as $unit) {
            $unit->set('status', 'Available');
            $unit->set('holdExpiryDate', null);
            $unit->set('holdOpportunityId', null);
            $this->getEntityManager()->saveEntity($unit);
        }
    }
}