
function ApiController()
{
		$(".apilink").on("click",function(event){
		    event.preventDefault();//使a自带的方法失效，即无法调整到href中的URL(http://www.baidu.com)

		    var param = $("#jsonStr").val();
		    console.log(param);
		    var href = $(this).attr("href");
			console.log(href);



		    $.ajax({
		           type: "POST",
		           url: href,
		           contentType:"application/json",
		           data: param,//参数列表
		           dataType:"json",
		           success: function(result){
		              //请求正确之后的操作

					   $("#jsonRel").val(JSON.stringify(result));


		           },
		           error: function(result){
		              //请求失败之后的操作
					   $("#jsonRel").val(JSON.stringify(result));
		           }
		    });
	});
}