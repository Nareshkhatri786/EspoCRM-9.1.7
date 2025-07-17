<?php

namespace Espo\Custom\Controllers;

use Espo\Controllers\Record;
use Espo\Core\Api\Request;
use Espo\Core\Api\Response;
use Espo\Core\Exceptions\BadRequest;
use Espo\Core\Exceptions\Forbidden;

class CPropertyUnit extends Record
{
    public function getEntityType(): string
    {
        return 'CPropertyUnit';
    }

    public function actionProcessExpiredHolds(Request $request): Response
    {
        if (!$this->getUser()->isAdmin()) {
            throw new Forbidden('Only Admin users can process expired holds');
        }

        $service = $this->getRecordService();
        $service->processExpiredHolds();

        return $this->createResponse(['success' => true]);
    }

    public function actionGetAvailableUnits(Request $request): Response
    {
        $projectId = $request->getQueryParam('projectId');
        
        if (!$projectId) {
            throw new BadRequest('Project ID is required');
        }

        $units = $this->getEntityManager()
            ->getRDBRepository('CPropertyUnit')
            ->where([
                'projectId' => $projectId,
                'status' => 'Available'
            ])
            ->find();

        return $this->createResponse(['list' => $units->getValueMapList()]);
    }

    public function actionGetProjectReport(Request $request): Response
    {
        $projectId = $request->getQueryParam('projectId');
        
        if (!$projectId) {
            throw new BadRequest('Project ID is required');
        }

        $repository = $this->getEntityManager()->getRDBRepository('CPropertyUnit');

        $report = [
            'available' => $repository->where(['projectId' => $projectId, 'status' => 'Available'])->count(),
            'shortlisted' => $repository->where(['projectId' => $projectId, 'status' => 'Shortlisted'])->count(),
            'hold' => $repository->where(['projectId' => $projectId, 'status' => 'Hold'])->count(),
            'tokenReceived' => $repository->where(['projectId' => $projectId, 'status' => 'Token Received'])->count(),
            'booked' => $repository->where(['projectId' => $projectId, 'status' => 'Booked'])->count(),
            'cancelled' => $repository->where(['projectId' => $projectId, 'status' => 'Cancelled'])->count(),
        ];

        $report['total'] = array_sum(array_values($report));

        return $this->createResponse($report);
    }

    private function createResponse(array $data): Response
    {
        $response = $this->responseFactory->create();
        $response->writeBody(json_encode($data));
        $response = $response->withHeader('Content-Type', 'application/json');

        return $response;
    }
}