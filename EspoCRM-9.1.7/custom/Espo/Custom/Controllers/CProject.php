<?php

namespace Espo\Custom\Controllers;

use Espo\Controllers\Record;

class CProject extends Record
{
    public function getEntityType(): string
    {
        return 'CProject';
    }
}