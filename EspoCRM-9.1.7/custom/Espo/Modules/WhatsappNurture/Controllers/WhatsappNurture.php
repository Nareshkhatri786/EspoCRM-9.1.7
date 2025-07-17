<?php

namespace Espo\Modules\WhatsappNurture\Controllers;

use Espo\Core\Controllers\Base;
use Espo\Core\Exceptions\BadRequest;
use Espo\Core\Exceptions\Forbidden;
use Espo\Core\Exceptions\NotFound;
use Espo\Core\Api\Request;
use Espo\Core\Api\Response;
use Espo\Core\Di;

class WhatsappNurture extends Base implements Di\ServiceFactoryAware, Di\EntityManagerAware
{
    use Di\ServiceFactorySetter;
    use Di\EntityManagerSetter;

    /**
     * Send WhatsApp template manually
     */
    public function postActionSendTemplate(Request $request, Response $response): \stdClass
    {
        $data = $request->getParsedBody();
        
        $leadId = $data->leadId ?? null;
        $flowName = $data->flowName ?? null;
        $stage = $data->stage ?? null;

        if (!$leadId || !$flowName || !$stage) {
            throw new BadRequest('Missing required parameters: leadId, flowName, stage');
        }

        // Get the lead
        $lead = $this->entityManager->getEntityById('Lead', $leadId);
        if (!$lead) {
            throw new NotFound('Lead not found');
        }

        // Check ACL
        if (!$this->acl->check($lead, 'edit')) {
            throw new Forbidden();
        }

        $assignedUserId = $lead->get('assignedUserId');
        if (!$assignedUserId) {
            throw new BadRequest('Lead has no assigned user');
        }

        $phoneNumber = $lead->get('phoneNumber');
        if (!$phoneNumber) {
            throw new BadRequest('Lead has no phone number');
        }

        $whatsappService = $this->serviceFactory->create('WhatsappService');
        
        // Get template mapping
        $templateMapping = $whatsappService->getTemplateMapping($assignedUserId, $flowName, $stage);
        if (!$templateMapping) {
            throw new NotFound('Template mapping not found for the specified flow and stage');
        }

        $templateName = $templateMapping->get('templateName');
        $parametersTemplate = $templateMapping->get('parameters') ?: [];
        $imageLink = $templateMapping->get('imageLink');

        // Resolve parameters
        $parameters = $whatsappService->resolveParameters($parametersTemplate, $lead);

        // Send message
        $success = $whatsappService->sendTemplateMessage(
            $phoneNumber,
            $assignedUserId,
            $templateName,
            $parameters,
            $imageLink
        );

        if (!$success) {
            throw new BadRequest('Failed to send WhatsApp message');
        }

        return (object) [
            'success' => true,
            'message' => 'WhatsApp message sent successfully'
        ];
    }

    /**
     * Get available flows for a user
     */
    public function getActionGetFlows(Request $request, Response $response): \stdClass
    {
        $userId = $request->getQueryParam('userId');
        if (!$userId) {
            throw new BadRequest('Missing userId parameter');
        }

        $flows = $this->entityManager
            ->getRDBRepository('NurtureFlow')
            ->where([
                'userId' => $userId,
                'isActive' => true
            ])
            ->find();

        $result = [];
        foreach ($flows as $flow) {
            $result[] = [
                'id' => $flow->getId(),
                'name' => $flow->get('name'),
                'steps' => $flow->get('steps')
            ];
        }

        return (object) [
            'flows' => $result
        ];
    }

    /**
     * Preview template variables for a flow/stage
     */
    public function getActionPreviewTemplate(Request $request, Response $response): \stdClass
    {
        $leadId = $request->getQueryParam('leadId');
        $flowName = $request->getQueryParam('flowName');
        $stage = $request->getQueryParam('stage');

        if (!$leadId || !$flowName || !$stage) {
            throw new BadRequest('Missing required parameters: leadId, flowName, stage');
        }

        $lead = $this->entityManager->getEntityById('Lead', $leadId);
        if (!$lead) {
            throw new NotFound('Lead not found');
        }

        $assignedUserId = $lead->get('assignedUserId');
        if (!$assignedUserId) {
            throw new BadRequest('Lead has no assigned user');
        }

        $whatsappService = $this->serviceFactory->create('WhatsappService');
        
        $templateMapping = $whatsappService->getTemplateMapping($assignedUserId, $flowName, $stage);
        if (!$templateMapping) {
            throw new NotFound('Template mapping not found');
        }

        $parametersTemplate = $templateMapping->get('parameters') ?: [];
        $resolvedParameters = $whatsappService->resolveParameters($parametersTemplate, $lead);

        return (object) [
            'templateName' => $templateMapping->get('templateName'),
            'parameters' => $parametersTemplate,
            'resolvedParameters' => $resolvedParameters,
            'imageLink' => $templateMapping->get('imageLink')
        ];
    }
}