<div class="row">
    <div class="col-md-12">
        <div class="form-group">
            <label for="flowName">Nurture Flow</label>
            <select class="form-control" data-name="flowName">
                <option value="">-- Select Flow --</option>
                {{#each flows}}
                <option value="{{name}}">{{name}}</option>
                {{/each}}
            </select>
        </div>
    </div>
</div>

<div class="row">
    <div class="col-md-12">
        <div class="form-group">
            <label for="stage">Stage</label>
            <select class="form-control" data-name="stage">
                <option value="">-- Select Stage --</option>
            </select>
        </div>
    </div>
</div>

<div class="row">
    <div class="col-md-12">
        <div class="preview-container">
            <!-- Preview will be populated here -->
        </div>
    </div>
</div>