define('custom:views/user/detail', 'views/record/detail', function (Dep) {
    
    return Dep.extend({
        
        actionOpenPwaApp: function () {
            window.open('/pwa', '_blank');
        }
        
    });
});
