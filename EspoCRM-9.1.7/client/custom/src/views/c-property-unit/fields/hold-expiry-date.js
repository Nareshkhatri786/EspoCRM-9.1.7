define('custom:views/c-property-unit/fields/hold-expiry-date', ['views/fields/date'], function (Dep) {

    return Dep.extend({

        setup: function () {
            Dep.prototype.setup.call(this);
            
            // Set default hold period to 10 days from now
            if (this.mode === 'edit' && !this.model.get('holdExpiryDate') && this.model.get('status') === 'Hold') {
                var holdDate = new Date();
                holdDate.setDate(holdDate.getDate() + 10);
                this.model.set('holdExpiryDate', holdDate.toISOString().split('T')[0]);
            }
        },

        isVisible: function () {
            return this.model.get('status') === 'Hold';
        }

    });
});