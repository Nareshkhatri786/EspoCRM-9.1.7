define('custom:whatsapp-nurture-handler', [], function () {

    var Handler = function (view) {
        this.view = view;
    };

    _.extend(Handler.prototype, {

        init: function () {
            this.controlSendWhatsappTemplateButton();
        },

        controlSendWhatsappTemplateButton: function () {
            var model = this.view.model;
            
            if (!model.get('assignedUserId') || !model.get('phoneNumber')) {
                this.view.hideHeaderActionItem('sendWhatsappTemplate');
            } else {
                this.view.showHeaderActionItem('sendWhatsappTemplate');
            }
        },

        actionSendWhatsappTemplate: function () {
            var model = this.view.model;
            
            if (!model.get('assignedUserId')) {
                Espo.Ui.error('Lead must have an assigned user');
                return;
            }
            
            if (!model.get('phoneNumber')) {
                Espo.Ui.error('Lead must have a phone number');
                return;
            }

            this.view.createView('whatsappModal', 'custom:views/modals/whatsapp-send', {
                model: model
            }, function (view) {
                view.render();
            });
        }

    });

    return Handler;
});