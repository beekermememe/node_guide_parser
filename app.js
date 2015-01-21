var Mysql = require('mysql')
var fs = require('fs')

var connection = Mysql.createConnection({
  host: 'host',
  user: 'user',
  password: 'password',
  database: 'database',
  debug: false,
  dateStrings: true
})

//var fileToOpen = "ListOfDifferences.txt"
var fileToOpen = "test2.txt"


var fileReader = fs.readFileSync(fileToOpen, 'utf8')
var linesToRead = fileReader.split("\n")


var arrayLength = linesToRead.length

connection.connect(function(err){
  if(err) {
    console.log("Error connecting to DB - " + err.stack);
    return;
  }
  console.log("Connection Successful");
})

var disconnect = function() {
  connection.end(function(err) {
    if(err) {
      console.log("Error terminating connection to DB - " + err.stack);
      return;
    }
    console.log("Connection Terminated");
  });
}

var lookForData = function(usid,startTime,endTime,connection,tms_id, callsign,program_title) {
  var start = startTime.replace("Z","").replace("T"," ")
  var end = endTime.replace("Z","").replace("T"," ")

  var queryString = "SELECT tms_id, dish_title,egid_for_sge,start_date_time,end_date_time FROM airings WHERE service_unique_id=" + usid

  //var queryString = "SELECT tms_id, dish_title,egid_for_sge FROM airings WHERE service_unique_id=" + usid
  connection.query(queryString,function(err,rows,columns){
    if(err){
      console.log("Problem connecting: " + err)
    } else {
      var row_size = rows.length
      if(row_size == 0){
        console.log('No Data found for ' + program_title + " > " + usid + " - " + callsign + " | " + tms_id + " Times = " + start + " : " + end)
      } else {
        var has_entry = false;
        for(i=0;i < row_size; i++){
          //console.log('Checking ' + row_size + " . " + usid + " - " + start + " == " + rows[i].start_date_time + " : " + rows[i].end_date_time + " == " + end)
          if(rows[i].start_date_time == start && rows[i].end_date_time == end) {
            //console.log('Found -- ' + usid + " - " + start + " : " + end + " | " + tms_id + " !==" + rows[i].egid_for_sge + " - " + rows[i].dish_title)
            has_entry = true
          }
        }
        if(has_entry === false){
          console.log('No Matching Time entry found for ' + program_title + " > " + usid + " - " + callsign + " | " + tms_id + " Times = " + start + " : " + end)
        }
      }
    }
  })
}

var loop_through = function(l_arrayToProcess,l_arrayLength,lookFor, connection) {
  for(var i=0,tmsId = null, callsign = null, startTime = null, endTime = null, usid = null, program_title = null,
    reForTmsId = /\[([SHMVEP0123456789]+)\] does not exist/,
    reForCallSign = /callsign: ([a-zA-z0-9]+)/,
    reForStartTime = /start_date_time: ([\-0-9:TZ]+)/,
    reForEndTime = /end_date_time: ([\-0-9:TZ]+)/,
    reForUsid = /usid: ([0-9]+)/,
    reForProgramTitle = /program_title: (.+)/,
    lineToProcess = null, reCheck = null;i<l_arrayLength;i++) {
      lineToProcess = l_arrayToProcess[i];

      reCheck = reForUsid.exec(lineToProcess);
      if(reCheck) {
        usid = reCheck[1];
      }

      reCheck = reForTmsId.exec(lineToProcess);
      if(reCheck) {
        tmsId = reCheck[1];
      }

      reCheck = reForCallSign.exec(lineToProcess);
      if(reCheck) {
        callsign = reCheck[1];
      }

      reCheck = reForStartTime.exec(lineToProcess);
      if(reCheck) {
        startTime = reCheck[1];
      }

      reCheck = reForEndTime.exec(lineToProcess);
      if(reCheck) {
        endTime = reCheck[1];
      }

      reCheck = reForProgramTitle.exec(lineToProcess);
      if(reCheck) {
        program_title = reCheck[1];
        lookFor(usid,startTime,endTime,connection,tmsId,callsign,program_title);
      }
  }
}

loop_through(linesToRead,arrayLength,lookForData,connection)


