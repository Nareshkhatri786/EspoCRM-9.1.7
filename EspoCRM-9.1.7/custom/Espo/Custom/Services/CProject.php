<?php

namespace Espo\Custom\Services;

use Espo\Services\Record;

class CProject extends Record
{
    public function getEntityType(): string
    {
        return 'CProject';
    }

    protected function beforeCreateEntity(\Espo\ORM\Entity $entity, $data)
    {
        parent::beforeCreateEntity($entity, $data);

        // Set default status if not provided
        if (!$entity->get('status')) {
            $entity->set('status', 'Active');
        }
    }

    protected function beforeUpdateEntity(\Espo\ORM\Entity $entity, $data)
    {
        parent::beforeUpdateEntity($entity, $data);

        // Additional validation if needed
    }
}