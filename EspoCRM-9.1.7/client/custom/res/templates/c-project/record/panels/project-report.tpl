<div class="panel-heading">
    <h4 class="panel-title">{{translate 'Project Report'}}</h4>
</div>
<div class="panel-body">
    <div class="row">
        <div class="col-md-6">
            <canvas id="statusChart" width="400" height="400"></canvas>
        </div>
        <div class="col-md-6">
            <table class="table table-striped">
                <tr>
                    <td><span class="label label-success">Available</span></td>
                    <td>{{reportData.available}}</td>
                </tr>
                <tr>
                    <td><span class="label label-primary">Shortlisted</span></td>
                    <td>{{reportData.shortlisted}}</td>
                </tr>
                <tr>
                    <td><span class="label label-warning">Hold</span></td>
                    <td>{{reportData.hold}}</td>
                </tr>
                <tr>
                    <td><span class="label label-info">Token Received</span></td>
                    <td>{{reportData.tokenReceived}}</td>
                </tr>
                <tr>
                    <td><span class="label label-success">Booked</span></td>
                    <td>{{reportData.booked}}</td>
                </tr>
                <tr>
                    <td><span class="label label-danger">Cancelled</span></td>
                    <td>{{reportData.cancelled}}</td>
                </tr>
                <tr class="success">
                    <td><strong>Total Units</strong></td>
                    <td><strong>{{reportData.total}}</strong></td>
                </tr>
            </table>
        </div>
    </div>
</div>