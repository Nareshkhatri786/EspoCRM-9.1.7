define('custom:views/c-property-unit/fields/hold-opportunity', ['views/fields/link'], function (Dep) {

    return Dep.extend({

        isVisible: function () {
            return this.model.get('status') === 'Hold';
        },

        getSelectFilters: function () {
            // Only show opportunities that don't already have a unit on hold
            return {
                'heldPropertyUnits': {
                    type: 'isEmpty'
                }
            };
        }

    });
});