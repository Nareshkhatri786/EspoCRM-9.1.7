define('custom:views/c-property-unit/list', ['views/list'], function (Dep) {

    return Dep.extend({

        setup: function () {
            Dep.prototype.setup.call(this);
        },

        actionProcessExpiredHolds: function () {
            if (!this.getUser().isAdmin()) {
                this.notify('Access denied', 'error');
                return;
            }

            this.confirm('Process all expired holds? This will automatically change status of expired hold units to Available.', () => {
                Espo.Ajax.postRequest('CPropertyUnit/action/processExpiredHolds')
                    .then(() => {
                        this.notify('Expired holds processed successfully', 'success');
                        this.collection.fetch();
                    })
                    .catch(() => {
                        this.notify('Error processing expired holds', 'error');
                    });
            });
        }

    });
});