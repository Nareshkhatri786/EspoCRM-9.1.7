define('custom:views/modals/whatsapp-send', ['views/modal'], function (Dep) {

    return Dep.extend({

        templateContent: '<div class="record">{{{record}}}</div>',

        className: 'dialog dialog-record',

        shortcutKeys: {
            'Control+Enter': 'send'
        },

        setup: function () {
            this.headerText = 'Send WhatsApp Template';

            this.buttonList = [
                {
                    name: 'send',
                    label: 'Send',
                    style: 'primary'
                },
                {
                    name: 'cancel',
                    label: 'Cancel'
                }
            ];

            this.createRecordView();
        },

        createRecordView: function () {
            var model = this.model;
            
            this.createView('record', 'custom:views/whatsapp-send-record', {
                model: model,
                el: this.options.el + ' .record'
            });
        },

        actionSend: function () {
            var recordView = this.getView('record');
            var data = recordView.fetch();

            if (!data.flowName || !data.stage) {
                Espo.Ui.error('Please select flow and stage');
                return;
            }

            this.disableButton('send');

            Espo.Ajax.postRequest('WhatsappNurture/action/sendTemplate', {
                leadId: this.model.id,
                flowName: data.flowName,
                stage: data.stage
            }).then(function (response) {
                Espo.Ui.success('WhatsApp message sent successfully');
                this.close();
            }.bind(this)).catch(function (error) {
                this.enableButton('send');
                Espo.Ui.error('Failed to send WhatsApp message: ' + error.message);
            }.bind(this));
        }

    });
});