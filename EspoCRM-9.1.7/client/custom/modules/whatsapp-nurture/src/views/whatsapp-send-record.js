define('custom:views/whatsapp-send-record', ['view'], function (Dep) {

    return Dep.extend({

        template: 'custom:whatsapp-send-record',

        data: function () {
            return {
                flows: this.flows || [],
                stages: this.stages || [],
                preview: this.preview || null
            };
        },

        setup: function () {
            this.flows = [];
            this.stages = [];
            this.preview = null;
            
            this.loadFlows();
        },

        afterRender: function () {
            this.$flowSelect = this.$el.find('[data-name="flowName"]');
            this.$stageSelect = this.$el.find('[data-name="stage"]');

            this.$flowSelect.on('change', function () {
                this.onFlowChange();
            }.bind(this));

            this.$stageSelect.on('change', function () {
                this.onStageChange();
            }.bind(this));
        },

        loadFlows: function () {
            var userId = this.model.get('assignedUserId');
            
            Espo.Ajax.getRequest('WhatsappNurture/action/getFlows?userId=' + userId)
                .then(function (response) {
                    this.flows = response.flows || [];
                    this.reRender();
                }.bind(this));
        },

        onFlowChange: function () {
            var flowName = this.$flowSelect.val();
            var flow = this.flows.find(f => f.name === flowName);
            
            if (flow && flow.steps) {
                this.stages = flow.steps.map(step => step.stage);
                this.$stageSelect.empty();
                this.$stageSelect.append('<option value="">-- Select Stage --</option>');
                
                this.stages.forEach(stage => {
                    this.$stageSelect.append('<option value="' + stage + '">' + stage + '</option>');
                });
            }
        },

        onStageChange: function () {
            var flowName = this.$flowSelect.val();
            var stage = this.$stageSelect.val();
            
            if (flowName && stage) {
                this.loadPreview(flowName, stage);
            }
        },

        loadPreview: function (flowName, stage) {
            var leadId = this.model.id;
            
            Espo.Ajax.getRequest('WhatsappNurture/action/previewTemplate?leadId=' + leadId + '&flowName=' + flowName + '&stage=' + stage)
                .then(function (response) {
                    this.preview = response;
                    this.showPreview();
                }.bind(this));
        },

        showPreview: function () {
            var $preview = this.$el.find('.preview-container');
            
            if (this.preview) {
                var html = '<h5>Template Preview</h5>';
                html += '<p><strong>Template:</strong> ' + this.preview.templateName + '</p>';
                
                if (this.preview.resolvedParameters && this.preview.resolvedParameters.length > 0) {
                    html += '<p><strong>Variables:</strong></p><ul>';
                    this.preview.resolvedParameters.forEach(param => {
                        html += '<li>' + param + '</li>';
                    });
                    html += '</ul>';
                }
                
                if (this.preview.imageLink) {
                    html += '<p><strong>Image:</strong> ' + this.preview.imageLink + '</p>';
                }
                
                $preview.html(html);
            }
        },

        fetch: function () {
            return {
                flowName: this.$flowSelect.val(),
                stage: this.$stageSelect.val()
            };
        }

    });
});