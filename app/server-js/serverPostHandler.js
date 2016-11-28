const pg = require('pg');
const fs = require('fs');
const express = require('express');


var pool = new pg.Pool({
	user: 'postgres',
	password: 'VibWotDoha',
	host: 'localhost',
	database: 'postgis_sample',
	idleTimeoutMillis: 1000
});

var handlers = {};

exports.handleTestQuery = (request, response) => {
	var handler = request.url.substring(1);
	handlers[handler](request, response);
}

handlers['query-street-url'] = (request, response) => {
	pool.connect((err, client, done) => {
		var body = request.body;
		console.log(body);
		console.log(body.street);
		
		var queryString = `with min_distance_query_1 as (
							select min(st_distance(ST_MakePoint(x1, y1),ST_MakePoint(` + body.rest_lon + `, ` + body.rest_lat + `))) min_distance from ways where (class_id between 100 and 112 or class_id between 123 and 125 or class_id = 401) and name = '` + body.street + `'
							)


							select source as id, ST_AsGeoJson(ST_MakePoint(x1, y1)) geojson from ways w, min_distance_query_1 where 
							st_distance(ST_MakePoint(x1, y1),ST_MakePoint(` + body.rest_lon + `, ` + body.rest_lat + `)) <= min_distance_query_1.min_distance and (class_id between 100 and 112 or class_id between 123 and 125 or class_id = 401) and w.name = '` + body.street + `' limit 1`;
		client.query(queryString, (err, result) => {
			console.log(result);
			done();
			console.log('done');
			response.set('Content-Type', 'text/plain');
			response.send(JSON.stringify(result));
		});
		
		
	});
}

handlers['query2-url'] = (request, response) => {
	pool.connect((err, client, done) => {
		var body = request.body;
		console.log(body);
		console.log(body.click_lon);
		console.log(body.click_lat);
		
		var queryString = `with min_distance_query_1 as (
								select min(st_distance(ST_MakePoint(x1, y1),ST_MakePoint( ` + body.click_lon + `, ` + body.click_lat + `))) min_distance from ways where class_id between 100 and 112 or class_id between 123 and 125 or class_id = 401
							)


							select source as id, ST_AsGeoJson(ST_MakePoint(x1, y1)) geojson from ways w, min_distance_query_1 where 
							st_distance(ST_MakePoint(x1, y1),ST_MakePoint( ` + body.click_lon + `, ` + body.click_lat + `)) <= min_distance_query_1.min_distance and w.class_id <=112 limit 1`;
							
		client.query(queryString, (err, result) => {
			console.log(result);
			done();
			console.log('done');
			response.set('Content-Type', 'text/plain');
			response.send(JSON.stringify(result));
		});
		
		
	});
}

handlers['query4-url'] = (request, response) => {
	
	var body = request.body;
	
	var tspQueryBuilder = "SELECT seq, id1, id2, round(cost::numeric, 2) AS cost FROM pgr_tsp('select id::integer, lon as x, lat as y from ways_vertices_pgr where id = " + body.restaurant + " ";
	
	body.deliveries.forEach(function(item){
		tspQueryBuilder += " or id = " + item;
	});
	
	tspQueryBuilder += " order by id', " + body.restaurant + ");";
	
	console.log(tspQueryBuilder);
	
	
	pool.connect((err, client, done) => {

		var routes = [(body.deliveries.length+2)];
	
		var finished = 0;
		var maxFinished = body.deliveries.length+1;
		function checkFinish() {
			finished++;
			if(finished === maxFinished)
				endHandler();
		}

		var queryString = tspQueryBuilder;
		var tspResult;
		
		client.query(queryString, (err, result) => {
			
			console.log(result)
			tspResult = result;
			
			var iterator = 0;
			result.rows.forEach(function(row) {
				
				console.log("---------------------------------");
				console.log(body.deliveries.length);
				console.log(iterator);
				
				var srcId = result.rows[iterator].id2;
				var destId = iterator >= body.deliveries.length ? result.rows[0].id2 : result.rows[iterator+1].id2;
				
				console.log(srcId);
				console.log(destId);
				console.log("---------------");	

				var dijkstraString = `
				select ST_AsGeoJson(linestring) geojson from (
				select w.the_geom linestring from
					(SELECT *
							FROM pgr_dijkstra(
									'select gid::integer as id, source::integer, target::integer, (cost/maxspeed_forward)::double precision as cost from ways where class_id between 100 and 112 or class_id between 123 and 125 or class_id = 401',
									` + srcId + `, ` + destId + `, false, false
							)) s
							left join ways w
							on w.gid = s.id2
							where w.the_geom is not null) qwert`;
				
				
				
				((x)=>{
					client.query(dijkstraString, (err, result) => {
						console.log("Writing path on " + x);
						routes[x] = result;
						checkFinish();
					}); 
				})(iterator);
				
				iterator++;
			});
		});
		
		
		
		
		function endHandler() {
			console.log(routes);
			//console.log(result);
			done();
			console.log('done');
			response.set('Content-Type', 'text/plain');
			response.send(JSON.stringify({ routes: routes, tsp: tspResult }));
		}
		
	});

}


