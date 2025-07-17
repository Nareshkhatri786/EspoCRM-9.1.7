<?php

namespace Espo\Custom\Jobs;

use Espo\Core\Job\JobDataLess;

class ProcessExpiredHolds implements JobDataLess
{
    public function __construct(
        private \Espo\Core\ServiceFactory $serviceFactory
    ) {}

    public function run(): void
    {
        $service = $this->serviceFactory->create('CPropertyUnit');
        $service->processExpiredHolds();
    }
}