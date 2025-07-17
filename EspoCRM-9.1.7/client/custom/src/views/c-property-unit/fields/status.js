define('custom:views/c-property-unit/fields/status', ['views/fields/enum'], function (Dep) {

    return Dep.extend({

        setup: function () {
            Dep.prototype.setup.call(this);
            
            this.listenTo(this.model, 'change:status', this.handleStatusChange);
        },

        handleStatusChange: function () {
            var status = this.model.get('status');
            var user = this.getUser();
            
            // Show/hide Hold Expiry Date field based on status
            if (status === 'Hold') {
                this.showField('holdExpiryDate');
                this.setFieldRequired('holdExpiryDate', true);
                this.showField('holdOpportunity');
                this.setFieldRequired('holdOpportunity', true);
            } else {
                this.hideField('holdExpiryDate');
                this.setFieldRequired('holdExpiryDate', false);
                this.hideField('holdOpportunity');
                this.setFieldRequired('holdOpportunity', false);
            }

            // Show/hide date fields based on status
            if (status === 'Token Received') {
                this.showField('tokenDate');
            } else {
                this.hideField('tokenDate');
            }

            if (status === 'Booked') {
                this.showField('bookingDate');
            } else {
                this.hideField('bookingDate');
            }
        },

        validateRequired: function () {
            var result = Dep.prototype.validateRequired.call(this);
            
            var status = this.model.get('status');
            if (status === 'Hold') {
                if (!this.model.get('holdExpiryDate')) {
                    this.showValidationMessage('Hold Expiry Date is required when status is Hold');
                    return true;
                }
                if (!this.model.get('holdOpportunityId')) {
                    this.showValidationMessage('Hold Opportunity is required when status is Hold');
                    return true;
                }
            }
            
            return result;
        },

        showField: function (fieldName) {
            var view = this.getParentView();
            if (view && view.showField) {
                view.showField(fieldName);
            }
        },

        hideField: function (fieldName) {
            var view = this.getParentView();
            if (view && view.hideField) {
                view.hideField(fieldName);
            }
        },

        setFieldRequired: function (fieldName, required) {
            var view = this.getParentView();
            if (view && view.setFieldRequired) {
                view.setFieldRequired(fieldName, required);
            }
        }

    });
});