define('custom:views/c-project/record/panels/project-report', ['view'], function (Dep) {

    return Dep.extend({

        template: 'custom:c-project/record/panels/project-report',

        setup: function () {
            this.wait(this.loadReport());
        },

        loadReport: function () {
            return Espo.Ajax.getRequest('CPropertyUnit/action/getProjectReport', {
                projectId: this.model.id
            }).then((data) => {
                this.reportData = data;
            });
        },

        data: function () {
            return {
                reportData: this.reportData || {}
            };
        },

        afterRender: function () {
            this.renderChart();
        },

        renderChart: function () {
            if (!this.reportData) return;

            var ctx = this.$el.find('canvas')[0];
            if (!ctx) return;

            new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: ['Available', 'Shortlisted', 'Hold', 'Token Received', 'Booked', 'Cancelled'],
                    datasets: [{
                        data: [
                            this.reportData.available || 0,
                            this.reportData.shortlisted || 0,
                            this.reportData.hold || 0,
                            this.reportData.tokenReceived || 0,
                            this.reportData.booked || 0,
                            this.reportData.cancelled || 0
                        ],
                        backgroundColor: [
                            '#28a745',
                            '#007bff',
                            '#ffc107',
                            '#17a2b8',
                            '#28a745',
                            '#dc3545'
                        ]
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            position: 'bottom'
                        }
                    }
                }
            });
        }

    });
});