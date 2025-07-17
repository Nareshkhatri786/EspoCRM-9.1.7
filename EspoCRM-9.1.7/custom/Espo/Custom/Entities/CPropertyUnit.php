<?php

namespace Espo\Custom\Entities;

use Espo\Core\Field\Date;
use Espo\Core\Field\Link;
use Espo\Core\Field\LinkMultiple;
use Espo\Core\Name\Field;
use Espo\Core\ORM\Entity;

class CPropertyUnit extends Entity
{
    public const ENTITY_TYPE = 'CPropertyUnit';

    public const STATUS_AVAILABLE = 'Available';
    public const STATUS_SHORTLISTED = 'Shortlisted';
    public const STATUS_HOLD = 'Hold';
    public const STATUS_TOKEN_RECEIVED = 'Token Received';
    public const STATUS_BOOKED = 'Booked';
    public const STATUS_CANCELLED = 'Cancelled';

    public function getUnitNumber(): ?string
    {
        return $this->get('unitNumber');
    }

    public function setUnitNumber(?string $unitNumber): self
    {
        return $this->set('unitNumber', $unitNumber);
    }

    public function getStatus(): ?string
    {
        return $this->get('status');
    }

    public function setStatus(?string $status): self
    {
        return $this->set('status', $status);
    }

    public function getHoldExpiryDate(): ?Date
    {
        /** @var ?Date */
        return $this->getValueObject('holdExpiryDate');
    }

    public function setHoldExpiryDate(?Date $holdExpiryDate): self
    {
        $this->setValueObject('holdExpiryDate', $holdExpiryDate);

        return $this;
    }

    public function getProject(): ?Link
    {
        /** @var ?Link */
        return $this->getValueObject('project');
    }

    public function setProject(?Link $project): self
    {
        $this->setValueObject('project', $project);

        return $this;
    }

    public function getHoldOpportunity(): ?Link
    {
        /** @var ?Link */
        return $this->getValueObject('holdOpportunity');
    }

    public function setHoldOpportunity(?Link $holdOpportunity): self
    {
        $this->setValueObject('holdOpportunity', $holdOpportunity);

        return $this;
    }

    public function getShortlistedOpportunities(): LinkMultiple
    {
        /** @var LinkMultiple */
        return $this->getValueObject('shortlistedOpportunities');
    }

    public function setShortlistedOpportunities(LinkMultiple $shortlistedOpportunities): self
    {
        $this->setValueObject('shortlistedOpportunities', $shortlistedOpportunities);

        return $this;
    }

    public function getTokenDate(): ?Date
    {
        /** @var ?Date */
        return $this->getValueObject('tokenDate');
    }

    public function setTokenDate(?Date $tokenDate): self
    {
        $this->setValueObject('tokenDate', $tokenDate);

        return $this;
    }

    public function getBookingDate(): ?Date
    {
        /** @var ?Date */
        return $this->getValueObject('bookingDate');
    }

    public function setBookingDate(?Date $bookingDate): self
    {
        $this->setValueObject('bookingDate', $bookingDate);

        return $this;
    }

    public function isAvailable(): bool
    {
        return $this->getStatus() === self::STATUS_AVAILABLE;
    }

    public function isOnHold(): bool
    {
        return $this->getStatus() === self::STATUS_HOLD;
    }

    public function isShortlisted(): bool
    {
        return $this->getStatus() === self::STATUS_SHORTLISTED;
    }

    public function isBooked(): bool
    {
        return $this->getStatus() === self::STATUS_BOOKED;
    }

    public function isCancelled(): bool
    {
        return $this->getStatus() === self::STATUS_CANCELLED;
    }

    public function hasTokenReceived(): bool
    {
        return $this->getStatus() === self::STATUS_TOKEN_RECEIVED;
    }

    public function getAssignedUser(): ?Link
    {
        /** @var ?Link */
        return $this->getValueObject(Field::ASSIGNED_USER);
    }

    public function getTeams(): LinkMultiple
    {
        /** @var LinkMultiple */
        return $this->getValueObject(Field::TEAMS);
    }

    public function setAssignedUser(Link $assignedUser = null): self
    {
        $this->setValueObject(Field::ASSIGNED_USER, $assignedUser);

        return $this;
    }

    public function setTeams(LinkMultiple $teams): self
    {
        $this->setValueObject(Field::TEAMS, $teams);

        return $this;
    }
}