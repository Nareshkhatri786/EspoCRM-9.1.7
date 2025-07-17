<?php

namespace tests\unit\Espo\Modules\WhatsappNurture;

use PHPUnit\Framework\TestCase;
use Espo\Modules\WhatsappNurture\Listeners\NewLeadListener;
use Espo\Modules\WhatsappNurture\Listeners\StageChangeListener;
use Espo\Core\ServiceFactory;
use Espo\Core\Utils\Log;
use Espo\ORM\Entity;

class ListenersTest extends TestCase
{
    protected $serviceFactory;
    protected $log;
    protected $whatsappService;

    protected function setUp(): void
    {
        $this->serviceFactory = $this->createMock(ServiceFactory::class);
        $this->log = $this->createMock(Log::class);
        $this->whatsappService = $this->createMock(\Espo\Modules\WhatsappNurture\Services\WhatsappService::class);
        
        $this->serviceFactory->method('create')
            ->with('WhatsappService')
            ->willReturn($this->whatsappService);
    }

    public function testNewLeadListener()
    {
        $listener = new NewLeadListener();
        $listener->setServiceFactory($this->serviceFactory);
        $listener->setLog($this->log);

        // Create mock lead entity that is new
        $lead = $this->createMock(Entity::class);
        $lead->method('getEntityType')->willReturn('Lead');
        $lead->method('isNew')->willReturn(true);
        $lead->method('getId')->willReturn('lead123');
        $lead->method('get')->with('assignedUserId')->willReturn('user123');

        // Expect the WhatsApp service to be called
        $this->whatsappService->expects($this->once())
            ->method('scheduleNextMessage')
            ->with('lead123', 'user123', 'newLead', 'newLead');

        $listener->afterSave($lead, []);
    }

    public function testNewLeadListenerSkipsExistingLead()
    {
        $listener = new NewLeadListener();
        $listener->setServiceFactory($this->serviceFactory);
        $listener->setLog($this->log);

        // Create mock lead entity that is NOT new
        $lead = $this->createMock(Entity::class);
        $lead->method('getEntityType')->willReturn('Lead');
        $lead->method('isNew')->willReturn(false);

        // Should NOT call WhatsApp service
        $this->whatsappService->expects($this->never())
            ->method('scheduleNextMessage');

        $listener->afterSave($lead, []);
    }

    public function testNewLeadListenerSkipsNonLeadEntity()
    {
        $listener = new NewLeadListener();
        $listener->setServiceFactory($this->serviceFactory);
        $listener->setLog($this->log);

        // Create mock non-lead entity
        $entity = $this->createMock(Entity::class);
        $entity->method('getEntityType')->willReturn('Contact');

        // Should NOT call WhatsApp service
        $this->whatsappService->expects($this->never())
            ->method('scheduleNextMessage');

        $listener->afterSave($entity, []);
    }

    public function testStageChangeListener()
    {
        $listener = new StageChangeListener();
        $listener->setServiceFactory($this->serviceFactory);
        $listener->setLog($this->log);

        // Create mock lead entity with status change
        $lead = $this->createMock(Entity::class);
        $lead->method('getEntityType')->willReturn('Lead');
        $lead->method('isNew')->willReturn(false);
        $lead->method('isAttributeChanged')->with('status')->willReturn(true);
        $lead->method('getId')->willReturn('lead123');
        $lead->method('get')->willReturnMap([
            ['assignedUserId', 'user123'],
            ['status', 'In Process']
        ]);

        // Expect the WhatsApp service to be called with mapped stage
        $this->whatsappService->expects($this->once())
            ->method('scheduleNextMessage')
            ->with('lead123', 'user123', 'leadNurture', 'proposal');

        $listener->beforeSave($lead, []);
    }

    public function testStageChangeListenerSkipsNewLead()
    {
        $listener = new StageChangeListener();
        $listener->setServiceFactory($this->serviceFactory);
        $listener->setLog($this->log);

        // Create mock new lead entity
        $lead = $this->createMock(Entity::class);
        $lead->method('getEntityType')->willReturn('Lead');
        $lead->method('isNew')->willReturn(true);

        // Should NOT call WhatsApp service
        $this->whatsappService->expects($this->never())
            ->method('scheduleNextMessage');

        $listener->beforeSave($lead, []);
    }

    public function testStageChangeListenerSkipsUnchangedStatus()
    {
        $listener = new StageChangeListener();
        $listener->setServiceFactory($this->serviceFactory);
        $listener->setLog($this->log);

        // Create mock lead entity without status change
        $lead = $this->createMock(Entity::class);
        $lead->method('getEntityType')->willReturn('Lead');
        $lead->method('isNew')->willReturn(false);
        $lead->method('isAttributeChanged')->with('status')->willReturn(false);

        // Should NOT call WhatsApp service
        $this->whatsappService->expects($this->never())
            ->method('scheduleNextMessage');

        $listener->beforeSave($lead, []);
    }
}