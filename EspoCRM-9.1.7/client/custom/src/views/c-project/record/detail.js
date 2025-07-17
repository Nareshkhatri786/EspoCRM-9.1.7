define('custom:views/c-project/record/detail', ['views/record/detail'], function (Dep) {

    return Dep.extend({

        setup: function () {
            Dep.prototype.setup.call(this);

            this.createView('projectReport', 'custom:views/c-project/record/panels/project-report', {
                el: this.options.el + ' .project-report-container',
                model: this.model,
                defs: {
                    label: 'Project Report'
                }
            });
        },

        afterRender: function () {
            Dep.prototype.afterRender.call(this);

            if (this.mode === 'detail') {
                var $container = $('<div class="project-report-container panel panel-default"></div>');
                this.$el.find('.record-panels').prepend($container);
                
                this.getView('projectReport').render();
            }
        }

    });
});