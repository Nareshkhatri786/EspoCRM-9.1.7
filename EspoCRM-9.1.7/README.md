# EspoCRM WhatsApp Nurture Flow System

This EspoCRM installation now includes a comprehensive WhatsApp nurture flow system that allows administrators to set up automated WhatsApp message sequences for leads using the Meta WhatsApp Business API.

## Features

- **Per-User Credentials**: Each user can have their own WhatsApp Business API credentials
- **Dynamic Template Management**: Create template mappings with variable placeholders per user/flow/stage
- **Customizable Nurture Sequences**: Define multi-stage flows with custom delays between messages
- **Automatic Lead Triggers**: Messages are automatically sent on lead creation and status changes
- **Manual Send Capability**: Send WhatsApp templates manually from the Lead detail view
- **Variable Resolution**: Dynamic replacement of placeholders like `{{lead.firstName}}` with actual lead data

## Setup Instructions

### 1. WhatsApp User Settings

Navigate to Administration → WhatsApp User Settings to configure per-user WhatsApp credentials:

- **User**: Select the user for whom you're configuring WhatsApp
- **Access Token**: WhatsApp Business API access token from Meta
- **Phone Number ID**: The phone number ID from your WhatsApp Business account
- **Is Active**: Enable/disable WhatsApp for this user

### 2. Nurture Flow Configuration

Go to Administration → Nurture Flow to create custom nurture sequences:

- **Name**: A descriptive name for your flow (e.g., "Lead Nurture", "Follow-up Sequence")
- **User**: The user who owns this flow
- **Steps**: JSON array defining the sequence stages and delays

#### Example Steps Configuration:
```json
[
  {"stage": "newLead", "delayHours": 1},
  {"stage": "qualification", "delayHours": 24}, 
  {"stage": "proposal", "delayHours": 48},
  {"stage": "followUp", "delayHours": 168}
]
```

### 3. Template Mapping

Configure WhatsApp Template Mapping in Administration → WhatsApp Template Mapping:

- **User**: The user who owns this template mapping
- **Flow**: Link to a specific nurture flow
- **Stage**: The stage this template applies to (newLead, qualification, proposal, won, lost, followUp, nurture)
- **Template Name**: The approved template name in your WhatsApp Business account
- **Parameters**: JSON object defining variable placeholders
- **Image Link**: Optional header image URL for the template

#### Example Parameters Configuration:
```json
{
  "leadName": "{{lead.firstName}}",
  "companyName": "{{lead.accountName}}",
  "phoneNumber": "{{lead.phoneNumber}}"
}
```

## Available Placeholders

You can use these placeholders in your parameters that will be replaced with actual lead data:

- `{{lead.firstName}}` - Lead's first name
- `{{lead.lastName}}` - Lead's last name
- `{{lead.accountName}}` - Company/account name
- `{{lead.phoneNumber}}` - Lead's phone number
- `{{lead.emailAddress}}` - Lead's email address
- `{{lead.title}}` - Lead's job title
- `{{lead.industry}}` - Lead's industry
- `{{lead.source}}` - Lead source
- `{{lead.status}}` - Current lead status

## How It Works

### Automatic Triggers

1. **New Lead Creation**: When a new lead is created with an assigned user, the system automatically schedules the first message in the "newLead" flow

2. **Status Changes**: When a lead's status changes, the system maps it to the appropriate nurture stage and schedules the next message:
   - New → newLead
   - Assigned → qualification  
   - In Process → proposal
   - Converted → won
   - Dead → lost
   - Recycled → followUp

### Manual Send

From any Lead detail view, users can:
1. Click the "Send WhatsApp Template" button
2. Select a flow and stage
3. Preview the resolved variables
4. Send the message immediately

### Scheduled Execution

The system uses EspoCRM's job scheduler to execute delayed messages. Make sure your cron job is properly configured to run `cron.php`.

## API Integration

The system integrates with the WhatsApp Business API using the endpoint:
```
POST https://app.waofficial.com/api/integration/whatsapp-message/{phoneNumberId}/messages
```

Each message is sent with:
- Bearer token authentication using the user's access token
- Template-based message format with resolved variables
- Optional header images for rich media templates

## Admin Setup Checklist

1. ✅ Configure WhatsApp User Settings for each user
2. ✅ Create Nurture Flows with appropriate stages and delays  
3. ✅ Set up Template Mappings linking flows to WhatsApp templates
4. ✅ Test manual send functionality from Lead detail view
5. ✅ Verify cron job is running for scheduled message execution
6. ✅ Monitor logs for any API errors or issues

## Troubleshooting

- **Messages not sending**: Check WhatsApp User Settings are active and credentials are valid
- **Variables not replacing**: Verify placeholder syntax uses double curly braces `{{lead.fieldName}}`
- **Scheduled messages not executing**: Ensure EspoCRM cron job is properly configured
- **Template not found errors**: Verify template mappings exist for the specific user/flow/stage combination

The system logs all WhatsApp-related activities to the EspoCRM log files for debugging purposes.