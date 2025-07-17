<?php

namespace Espo\Custom\Hooks\CPropertyUnit;

use Espo\Core\Hook\Hook\BeforeSave;
use Espo\Core\Hook\Hook\AfterSave;
use Espo\Core\Exceptions\BadRequest;
use Espo\Core\Exceptions\Forbidden;
use Espo\ORM\Entity;

class StatusValidation implements BeforeSave, AfterSave
{
    public function __construct(
        private \Espo\Core\Utils\EntityManager $entityManager,
        private \Espo\Entities\User $user
    ) {}

    public function beforeSave(Entity $entity, array $options): void
    {
        if (!$entity->isAttributeChanged('status')) {
            return;
        }

        $newStatus = $entity->get('status');
        $oldStatus = $entity->getFetched('status');

        // Check admin permissions for restricted status changes
        if ($this->isRestrictedStatusChange($oldStatus, $newStatus) && !$this->user->isAdmin()) {
            throw new Forbidden('Only Admin users can change status from Token Received, Booked, or Cancelled back to Available');
        }

        // Validate Hold status requirements
        if ($newStatus === 'Hold') {
            $this->validateHoldStatus($entity);
        }

        // Auto-set dates based on status
        if ($newStatus === 'Token Received' && !$entity->get('tokenDate')) {
            $entity->set('tokenDate', date('Y-m-d'));
        }

        if ($newStatus === 'Booked' && !$entity->get('bookingDate')) {
            $entity->set('bookingDate', date('Y-m-d'));
        }

        // Clear hold-related fields when status changes from Hold
        if ($oldStatus === 'Hold' && $newStatus !== 'Hold') {
            $entity->set('holdExpiryDate', null);
            $entity->set('holdOpportunityId', null);
        }
    }

    public function afterSave(Entity $entity, array $options): void
    {
        if (!$entity->isAttributeChanged('status')) {
            return;
        }

        $newStatus = $entity->get('status');
        
        // Update shortlisted opportunities relationship based on status
        if ($newStatus === 'Shortlisted') {
            // Keep shortlisted opportunities
        } elseif ($newStatus !== 'Available') {
            // Clear shortlisted opportunities for non-available statuses
            $this->entityManager->getRDBRepository('CPropertyUnit')
                ->getRelation($entity, 'shortlistedOpportunities')
                ->removeAll();
        }
    }

    private function isRestrictedStatusChange(?string $oldStatus, string $newStatus): bool
    {
        if ($newStatus !== 'Available') {
            return false;
        }

        return in_array($oldStatus, ['Token Received', 'Booked', 'Cancelled']);
    }

    private function validateHoldStatus(Entity $entity): void
    {
        if (!$entity->get('holdExpiryDate')) {
            throw new BadRequest('Hold Expiry Date is required when status is Hold');
        }

        if (!$entity->get('holdOpportunityId')) {
            throw new BadRequest('Hold Opportunity is required when status is Hold');
        }

        // Check if the opportunity already has another unit on hold
        $existingHold = $this->entityManager
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
    }
}