define('custom:views/c-property-unit/fields/shortlisted-opportunities', ['views/fields/link-multiple'], function (Dep) {

    return Dep.extend({

        isVisible: function () {
            var status = this.model.get('status');
            return status === 'Shortlisted' || status === 'Available';
        }

    });
});