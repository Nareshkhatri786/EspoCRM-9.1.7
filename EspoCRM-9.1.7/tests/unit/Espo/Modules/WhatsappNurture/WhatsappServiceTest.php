<?php

namespace tests\unit\Espo\Modules\WhatsappNurture;

use PHPUnit\Framework\TestCase;
use Espo\Modules\WhatsappNurture\Services\WhatsappService;
use Espo\ORM\EntityManager;
use Espo\Core\Utils\Log;
use Espo\Core\ServiceFactory;

class WhatsappServiceTest extends TestCase
{
    protected $whatsappService;
    protected $entityManager;
    protected $log;
    protected $serviceFactory;

    protected function setUp(): void
    {
        $this->entityManager = $this->createMock(EntityManager::class);
        $this->log = $this->createMock(Log::class);
        $this->serviceFactory = $this->createMock(ServiceFactory::class);

        $this->whatsappService = new WhatsappService();
        $this->whatsappService->setEntityManager($this->entityManager);
        $this->whatsappService->setLog($this->log);
    }

    public function testResolveParameters()
    {
        // Create mock lead entity
        $lead = $this->createMock(\Espo\Entities\Lead::class);
        $lead->method('has')->willReturnMap([
            ['firstName', true],
            ['lastName', true],
            ['accountName', true]
        ]);
        $lead->method('get')->willReturnMap([
            ['firstName', 'John'],
            ['lastName', 'Doe'],
            ['accountName', 'Acme Corp']
        ]);

        // Test parameter resolution
        $parameters = [
            'greeting' => 'Hello {{lead.firstName}}',
            'company' => 'from {{lead.accountName}}',
            'fullName' => '{{lead.firstName}} {{lead.lastName}}'
        ];

        $resolved = $this->whatsappService->resolveParameters($parameters, $lead);

        $this->assertEquals(['Hello John', 'from Acme Corp', 'John Doe'], $resolved);
    }

    public function testResolveParametersWithMissingFields()
    {
        // Create mock lead entity with missing fields
        $lead = $this->createMock(\Espo\Entities\Lead::class);
        $lead->method('has')->willReturnMap([
            ['firstName', true],
            ['lastName', false],
            ['accountName', false]
        ]);
        $lead->method('get')->willReturnMap([
            ['firstName', 'John'],
            ['lastName', null],
            ['accountName', null]
        ]);

        $parameters = [
            'greeting' => 'Hello {{lead.firstName}}',
            'company' => 'from {{lead.accountName}}',
            'missing' => '{{lead.lastName}}'
        ];

        $resolved = $this->whatsappService->resolveParameters($parameters, $lead);

        $this->assertEquals(['Hello John', 'from ', ''], $resolved);
    }

    public function testGetTemplateMappingSuccess()
    {
        // Mock flow repository
        $flowRepo = $this->createMock(\Espo\ORM\Repository\Repository::class);
        $flow = $this->createMock(\Espo\ORM\Entity::class);
        $flow->method('getId')->willReturn('flow123');
        
        $flowRepo->method('where')->willReturnSelf();
        $flowRepo->method('findOne')->willReturn($flow);

        // Mock template mapping repository
        $mappingRepo = $this->createMock(\Espo\ORM\Repository\Repository::class);
        $mapping = $this->createMock(\Espo\ORM\Entity::class);
        
        $mappingRepo->method('where')->willReturnSelf();
        $mappingRepo->method('findOne')->willReturn($mapping);

        $this->entityManager->method('getRDBRepository')
            ->willReturnMap([
                ['NurtureFlow', $flowRepo],
                ['WhatsappTemplateMapping', $mappingRepo]
            ]);

        $result = $this->whatsappService->getTemplateMapping(1, 'testFlow', 'newLead');
        
        $this->assertSame($mapping, $result);
    }

    public function testGetTemplateMappingFlowNotFound()
    {
        // Mock flow repository that returns null
        $flowRepo = $this->createMock(\Espo\ORM\Repository\Repository::class);
        $flowRepo->method('where')->willReturnSelf();
        $flowRepo->method('findOne')->willReturn(null);

        $this->entityManager->method('getRDBRepository')
            ->willReturn($flowRepo);

        $result = $this->whatsappService->getTemplateMapping(1, 'nonexistentFlow', 'newLead');
        
        $this->assertNull($result);
    }

    public function testScheduleNextMessageWithValidFlow()
    {
        // Mock flow with steps
        $flow = $this->createMock(\Espo\ORM\Entity::class);
        $steps = [
            ['stage' => 'newLead', 'delayHours' => 24],
            ['stage' => 'qualification', 'delayHours' => 48],
            ['stage' => 'proposal', 'delayHours' => 72]
        ];
        $flow->method('get')->with('steps')->willReturn($steps);

        // Mock flow repository
        $flowRepo = $this->createMock(\Espo\ORM\Repository\Repository::class);
        $flowRepo->method('where')->willReturnSelf();
        $flowRepo->method('findOne')->willReturn($flow);

        // Mock job entity
        $job = $this->createMock(\Espo\ORM\Entity::class);
        
        $this->entityManager->method('getRDBRepository')->willReturn($flowRepo);
        $this->entityManager->method('getNewEntity')->with('Job')->willReturn($job);
        $this->entityManager->method('saveEntity')->with($job)->willReturn(true);

        $result = $this->whatsappService->scheduleNextMessage(123, 1, 'testFlow', 'newLead');
        
        $this->assertTrue($result);
    }

    public function testScheduleNextMessageLastStage()
    {
        // Mock flow with steps where we're at the last stage
        $flow = $this->createMock(\Espo\ORM\Entity::class);
        $steps = [
            ['stage' => 'newLead', 'delayHours' => 24],
            ['stage' => 'qualification', 'delayHours' => 48]
        ];
        $flow->method('get')->with('steps')->willReturn($steps);

        // Mock flow repository
        $flowRepo = $this->createMock(\Espo\ORM\Repository\Repository::class);
        $flowRepo->method('where')->willReturnSelf();
        $flowRepo->method('findOne')->willReturn($flow);

        $this->entityManager->method('getRDBRepository')->willReturn($flowRepo);

        // Should return false since there's no next step after 'qualification'
        $result = $this->whatsappService->scheduleNextMessage(123, 1, 'testFlow', 'qualification');
        
        $this->assertFalse($result);
    }
}