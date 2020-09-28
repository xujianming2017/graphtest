
$(document).ready(function(){

	$('#login').click(function(evt){
		evt.preventDefault();
		$.ajax({
			url: '/login2',
			type: 'POST',
			data: {
				username: $('#username').val(),
				password: $('#password').val()
			},
			success: function(data){

				console.log("data:"+data);

				if(data.ret_code === 0){
					location.reload();
				}
			}
		});
	});

});
