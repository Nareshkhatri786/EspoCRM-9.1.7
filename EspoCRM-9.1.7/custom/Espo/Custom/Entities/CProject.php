<?php

namespace Espo\Custom\Entities;

use Espo\Core\Field\Link;
use Espo\Core\Field\LinkMultiple;
use Espo\Core\Name\Field;
use Espo\Core\ORM\Entity;

class CProject extends Entity
{
    public const ENTITY_TYPE = 'CProject';

    public const STATUS_ACTIVE = 'Active';
    public const STATUS_INACTIVE = 'Inactive';

    public function getName(): ?string
    {
        return $this->get(Field::NAME);
    }

    public function setName(?string $name): self
    {
        $this->set(Field::NAME, $name);

        return $this;
    }

    public function getLocation(): ?string
    {
        return $this->get('location');
    }

    public function setLocation(?string $location): self
    {
        return $this->set('location', $location);
    }

    public function getDescription(): ?string
    {
        return $this->get('description');
    }

    public function setDescription(?string $description): self
    {
        return $this->set('description', $description);
    }

    public function getStatus(): ?string
    {
        return $this->get('status');
    }

    public function setStatus(?string $status): self
    {
        return $this->set('status', $status);
    }

    public function isActive(): bool
    {
        return $this->getStatus() === self::STATUS_ACTIVE;
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