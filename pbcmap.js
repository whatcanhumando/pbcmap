var map; // 创建Map实例
var geoc;
var bdary;
var countCallBack = 0;
var labelArray = new Array();
var color = new Array("#000088",
	"#008000",
	"#18C1E3",
	"#330000",
	"#880000",
	"#47CCAF",
	"#ff3300",
	"#ff0055",
	"#440069",
	"#229475",
	"#453683");


var josnObject;
var josnTableIndex;
var mapState;//5表示中国；4表示省；3表示市；2表示县；1表示金融机构

function drawArea(){

	if(parseInt(josnObject.Tables[josnTableIndex].Rows[0].regionType) == 5)
		return;
	countCallBack = 0;
	for (var i = 0; i < josnObject.Tables[josnTableIndex].Rows.length; i++) {
		var area = josnObject.Tables[josnTableIndex].Rows[i].region;
		bdary.get(area, drawBdy);
	}
}

function changeZoom(){
	var zoomNumber = 0;
	switch(parseInt(josnObject.Tables[josnTableIndex].Rows[0].regionType)){
		case 1:
			zoomNumber = 4;
			break;
		case 2:
			zoomNumber = 7;
			break;
		case 3:
			zoomNumber = 8;
			break;
		case 4:
			zoomNumber = 9;
			break;
		default:
			zoomNumber = 14;
	}
	map.setZoom(zoomNumber);
}

function InitMap(data){
	josnObject = eval("(" + data + ")");
	josnTableIndex = 0;
	mapState = josnObject.Tables.length;
	handleChart();
	drawArea();
	handleInfoup();
	changeZoom();
}
	
function handleChart() {
	if(parseInt(josnObject.Tables[josnTableIndex].Rows[0].regionType) == 1)
		return;

	var indexMax= 0;
	var prop = 0;
	$('#infodown div').remove();
	for (var i = 0; i < josnObject.Tables[josnTableIndex].Rows.length; i++) {
		var $node = $("<div>" + josnObject.Tables[josnTableIndex].Rows[i].region + ":"  + josnObject.Tables[josnTableIndex].Rows[i].index + "</div>");
		$("#infodown").append($node);
		if (parseInt(indexMax) < parseInt(josnObject.Tables[josnTableIndex].Rows[i].index))
			indexMax = josnObject.Tables[josnTableIndex].Rows[i].index;
	}

	for(var i = 0; i < josnObject.Tables[josnTableIndex].Rows.length; i++){
		prop = parseInt(josnObject.Tables[josnTableIndex].Rows[i].index / indexMax * 150 + 100);
		var $node = $("#infodown div:eq(" + i + ")");
		$node.css("width", prop + "px");
	}
}

$(document).ready(function() {
	map = new BMap.Map("allmap"); // 创建Map实例
	map.centerAndZoom("温州", 9); // 初始化地图,设置中心点坐标和地图级别
	map.addControl(new BMap.MapTypeControl()); //添加地图类型控件
	map.setCurrentCity("温州"); // 设置地图显示的城市 此项是必须设置的
	map.enableScrollWheelZoom(); //开启鼠标滚轮缩放
	bdary = new BMap.Boundary();
	geoc = new BMap.Geocoder();

	$.post("initMap",{
		Query:"initMap"
	}, InitMap);


	map.addEventListener('zoomend', function(e) {
		var size = map.getZoom();
		var labelStyle = {};
		if (size < 9)
			size = 0;
		labelStyle.fontSize = size * 2 + "px";
		for (var i = 0; i < labelArray.length; i++)
			labelArray[i].setStyle(labelStyle);
	})
})


function handleInfoup() {
	if(parseInt(josnObject.Tables[josnTableIndex].Rows[0].regionType) == 5)
		return;
	$('#infoup p').remove();
	for(var i = 0; i < josnObject.Tables[josnTableIndex].Rows.length; i++){
		var region = josnObject.Tables[josnTableIndex].Rows[i].region;
		var message = josnObject.Tables[josnTableIndex].Rows[i].message;
		var index = josnObject.Tables[josnTableIndex].Rows[i].index;
		var $infoup = $("<p><span style=\"font-weight:bold\">" + region + ":</span> " + message + "</p>");
		$('#infoup').append($infoup);
	}
}

function addMarker(region, message, city){
	geoc.getPoint(region, function(point) {
		if(point){
			var myIcon = new BMap.Icon("flag.png", new BMap.Size(26, 26));
			var marker = new BMap.Marker(point,{icon: myIcon});

			marker.addEventListener('mouseover', function(){
				var $infoup = $("<p>" + message + "</p>");
				$('#infoup p').remove();
				$('#infoup').append($infoup);
			})
			map.addOverlay(marker);
		}
	}, city);
}

function areaListoner(ply) {
	ply.addEventListener('mouseover', function(e) {
		if(!ply.getFillColor())
			return;
		ply.setFillColor('#ffffff');
	});//鼠标进入事件

	ply.addEventListener('mouseout', function(e) {
		if(!ply.getFillColor())
			return;
		var oldColor = ply.getStrokeColor()
		ply.setFillColor(oldColor);
	});//鼠标离开事件

	ply.addEventListener('click', function(e){
		var strokeWeight = ply.getStrokeWeight();
		var pt = e.point;
		if(strokeWeight == 1){
			mapState = 1;
			josnTableIndex = josnObject.Tables.length - 1;

			var strokeStyle = ply.getStrokeStyle();
			if(strokeStyle == "solid"){
				new BMap.Geocoder().getLocation(pt, function(rs){
					var addComp = rs.addressComponents;
					for(var i = 0; i < josnObject.Tables[josnTableIndex].Rows.length; i++){
						if(josnObject.Tables[josnTableIndex].Rows[i].lastRegion.trim() != addComp.district.trim()){
							continue;
						}
						addMarker(josnObject.Tables[josnTableIndex].Rows[i].region, josnObject.Tables[josnTableIndex].Rows[i].message, addComp.city);
					}
				});
				ply.setStrokeStyle("dashed");
			}
			if(josnTableIndex > 0){
					$("#lastStep").attr("disabled",false);
			}
		}
		if(strokeWeight == 2){
			new BMap.Geocoder().getLocation(pt, function(rs){
				var addComp = rs.addressComponents;
				var count = 0;
				josnTableIndex++;
				for(var i = 0; i < josnObject.Tables[josnTableIndex].Rows.length; i++){
					if(josnObject.Tables[josnTableIndex].Rows[i].lastRegion.trim() != addComp.city.trim()){
						continue;
					} else {
						count++;
					}
				}
				if(count == 0){
					josnTableIndex--;
					return;
				}
				var allOverlays = map.getOverlays();
				for(var i = 0; i < allOverlays.length; i++){
					if(allOverlays[i].constructor == BMap.Polygon){
						allOverlays[i].setFillColor();
					}
				}
				mapState--;
				handleChart();
				drawArea();
				handleInfoup();
				changeZoom();
				map.setCenter(pt);
				if(josnTableIndex > 0){
					$("#lastStep").attr("disabled",false);
				}
			});
		}
		if(strokeWeight == 3){
			new BMap.Geocoder().getLocation(pt, function(rs){
				var addComp = rs.addressComponents;
				var count = 0;
				josnTableIndex++;
				for(var i = 0; i < josnObject.Tables[josnTableIndex].Rows.length; i++){
					if(josnObject.Tables[josnTableIndex].Rows[i].lastRegion.trim() != addComp.province.trim()){
						continue;
					} else {
						count++;
					}
				}
				if(count == 0){
					josnTableIndex--;
					return;
				}
				var allOverlays = map.getOverlays();
				for(var i = 0; i < allOverlays.length; i++){
					if(allOverlays[i].constructor == BMap.Polygon){
						allOverlays[i].setFillColor();
					}
				}
				mapState--;
				handleChart();
				drawArea();
				handleInfoup();
				changeZoom();
				map.setCenter(pt);
				if(josnTableIndex > 0){
					$("#lastStep").attr("disabled",false);
				}
			});
		}
		if(strokeWeight == 4){
			new BMap.Geocoder().getLocation(pt, function(rs){
				var addComp = rs.addressComponents;
				var count = 0;
				josnTableIndex++;
				for(var i = 0; i < josnObject.Tables[josnTableIndex].Rows.length; i++){
					if(josnObject.Tables[josnTableIndex].Rows[i].lastRegion.trim() != "中国"){
						continue;
					} else {
						count++;
					}
				}
				if(count == 0){
					josnTableIndex--;
					return;
				}
				var allOverlays = map.getOverlays();
				for(var i = 0; i < allOverlays.length; i++){
					if(allOverlays[i].constructor == BMap.Polygon){
						allOverlays[i].setFillColor();
					}
				}
				mapState--;
				handleChart();
				drawArea();
				handleInfoup();
				changeZoom();
				map.setCenter(pt);
				if(josnTableIndex > 0){
					$("#lastStep").attr("disabled",false);
				}
			});
		}
	});
}

function drawLabel(rs){
	var centerArray = rs.boundaries[0].split(";");
	var centerX = 0;
	var centerY = 0;

	for (centerIndex = 0; centerIndex < centerArray.length; centerIndex++) {
		var centerPoint = centerArray[centerIndex].split(",");
		centerX += parseFloat(centerPoint[0]);
		centerY += parseFloat(centerPoint[1]);
	}
	centerX /= centerArray.length;
	centerY /= centerArray.length;
	var center = new BMap.Point(centerX, centerY);
	var opts = {
		position : center, // 指定文本标注所在的地理位置
		offset : new BMap.Size(-22, -30)//设置文本偏移量
		};

	geoc.getLocation(center, function(rs) {
		if(mapState == 5 || mapState == 1)
			return;
		var text;
		if(mapState == 4){
			text = rs.addressComponents.province;
		}
		if(mapState == 3){
			text = rs.addressComponents.city;
		}
		if(mapState == 2){
			text = rs.addressComponents.district;
		}
		var label = new BMap.Label(text, opts); // 创建文本标注对象
		var labelStyle = {};
		labelStyle.color = "black";
		labelStyle.backgroundColor = "none";
		labelStyle.fontWeight = "bold";
		labelStyle.borderStyle = "none";
		
		var size = map.getZoom();
		if (size < 9)
			size = 0;
		labelStyle.fontSize = size * 2 + "px";

		label.setStyle(labelStyle);
		map.addOverlay(label);
		labelArray.push(label);
	});
}

function drawBdy(rs) { //获取行政区域
	var count = rs.boundaries.length; //行政区域的点有多少个
	if (count === 0) {
		alert('未能获取当前输入行政区域');
		return;
	}

	var ply;
	for (var i = 0; i < count; i++) {
		ply = new BMap.Polygon(rs.boundaries[i], {strokeWeight: mapState - 1}); //建立多边形覆盖物
		map.addOverlay(ply);  //添加覆盖物
		ply.setStrokeColor(color[countCallBack % 11]);
		ply.setFillColor(color[countCallBack % 11]);
		areaListoner(ply);
	}    
	countCallBack++;
	drawLabel(rs);
}

function clickLastStep(){
	map.clearOverlays();
	mapState++;
	josnTableIndex--;
	handleChart();
	drawArea();
	handleInfoup();
	changeZoom();
	if(josnTableIndex == 0){
		$("#lastStep").attr("disabled","false");
	}
}
	
	