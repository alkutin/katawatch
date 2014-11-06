/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
var app = {
    filesToPlay: [],
    isStopped: true,
    counterInterval: null,
    playInterval: null,
    playingMedia: null,
    isPlaying: false,
    isDirect: false,
    directSounds: [],
    sounds: [],
    prevAccel: {x: 0, y: 0, z: 0, m: 0},
    isMoving: false,
    watchID: 0,
    headingID: 0,
    currentHeading: 0,
    lastLogText: "",
    getRootPath: function() {
        var path = window.location.pathname;
        var phoneGapPath = path.substring(0, path.lastIndexOf('/') + 1);
        return phoneGapPath;
    },
    // Application Constructor
    initialize: function() {
        this.bindEvents();        
    },
    // Bind Event Listeners
    //
    // Bind any events that are required on startup. Common events are:
    // 'load', 'deviceready', 'offline', and 'online'.
    bindEvents: function() {
        document.addEventListener('deviceready', this.onDeviceReady, false);
    },
    // deviceready Event Handler
    //
    // The scope of 'this' is the event. In order to call the 'receivedEvent'
    // function, we must explicitly call 'app.receivedEvent(...);'
    onDeviceReady: function() {
        app.receivedEvent('deviceready');
        $("#ButtonsPanel").show();
        navigator.vibrate(250);        
    },
    // Update DOM on a Received Event
    receivedEvent: function(id) {
        
        console.log('Received Event: ' + id);
    },
    doLog: function(message) {
        if (!$("#LogEnabled").is(':checked'))
            return;
        
        if (message != app.lastLogText) {                        
            $("#LogPanel ul").append("<li>" + message + "</li>");
            app.lastLogText = message;
        }
    },
    
    stopPlaying: function() {
        if (app.playingMedia != null) {
            app.playingMedia.stop();
            app.playingMedia.release();
            app.playingMedia = null;
        };
    },
    
    playNext: function() {
        if (app.filesToPlay.length == 0)
            return;
        
        var file = app.filesToPlay.splice(0, 1)[0];
        app.playingMedia = new Media(file, 
            function(success) {
                //$("#History").prepend("<li>" + success + "</li>");  
                app.stopPlaying();
            },
            function(err) {
                //app.addHistory(err);            
                //app.doLog(JSON.stringify(err));
                app.stopPlaying();
            },
            function(status) {
                app.isPlaying = status == 2;
                //$("#History").prepend("<li>" + status + "</li>");
            });                  
            
        app.playingMedia.setVolume("1.0");
        app.playingMedia.play();
        $("#StopCount").text(soundFile);
    }
};

app.initialize();

$(document).ready(function() {
    $("#StopCount").click(function() {
            console.log("Stop clicked");
            app.isStopped = true;
            
            window.plugins.insomnia.allowSleepAgain();
            
            if (app.counterInterval != null) {
                clearInterval(app.counterInterval);
                app.counterInterval = null;
            };
            
            if (app.playInterval != null) {
                clearInterval(app.playInterval);
                app.playInterval = null;
            };
            
            app.filesToPlay.length = 0;
            app.stopPlaying();
                
            if (app.watchID != 0) {
                navigator.accelerometer.clearWatch(app.watchID);
                app.watchID = 0;
            }
            
            if (app.headingID != 0) {
                navigator.compass.clearWatch(app.headingID);
                app.headingID = 0;
            }
            
            $("#StopCount").text("Stopped");
            navigator.vibrate(250);
        });
        
        $(".countStart").click(function(event) {
            console.log("Count started");
            app.isStopped = false;
            $("#StopCount").text("Preparing");
            
            if (app.counterInterval != null) {
                clearInterval(app.counterInterval);
                app.counterInterval = null;
            };
            
            app.sounds = JSON.parse($(event.target).attr('data-sounds'));
            app.direct = $(event.target).attr('data-direct') == "true";
            app.directSounds = [];
            console.log(app.sounds);
            
            window.plugins.insomnia.keepAwake();      
            var speakerPhone = $("#SpeakerPhone").val();
            if (speakerPhone == "Speaker") {
                AudioToggle.setAudioMode(AudioToggle.SPEAKER);
            } else if (speakerPhone == "Headset") {
                AudioToggle.setAudioMode(AudioToggle.EARPIECE);
            };
            
            var timerMSecs = parseInt($("#TimerMSecs").val(), 10);
            app.doLog('Interval: ' + timerMSecs);
            app.counterInterval = setInterval(function() {   
                try
                {
                    if (app.isStopped || app.isMoving)// || app.isPlaying)
                        return;

                    var soundFile;

                    if (app.directSounds.length == 0) {
                            app.sounds.forEach(function(category) {
                               var soundsCategory = sounds[category];
                               soundsCategory.forEach(function(sound) {
                                  app.directSounds.push(sound) ;
                               });
                            });

                            app.directSounds.reverse();
                        };

                    if (app.filesToPlay.length < 7) {
                        if (app.direct) {
                            soundFile = app.directSounds.pop();
                        } else {
                            //var categoryRnd = Math.floor(Math.random() * app.sounds.length);
                            //var soundCategory = sounds[app.sounds[categoryRnd]];
                            //console.log(categoryRnd, soundCategory);
                            //var fileRnd = Math.floor(Math.random() * soundCategory.length);                
                            var idx = Math.floor(Math.random() * app.directSounds.length);                    
                            soundFile = app.directSounds[idx]; //soundCategory[fileRnd];
                            app.directSounds.splice(idx, 1);
                        }

                        var file = app.getRootPath() + "audio/" + soundFile;

                        app.filesToPlay.push(file);
                    };
                    //console.log(file);                    
                }
                catch (errMsg) {
                    app.doLog(errMsg);
                };
            }, timerMSecs);
            
            app.playInterval = setInterval(function() {
                if (app.playingMedia == null) {
                    app.playNext();
                };
            }, 200);
            
            app.headingID = navigator.compass.watchHeading(
                function(heading) {
                    app.currentHeading = heading.magneticHeading;
                }, 
                function(err) {
                    //app.doLog(JSON.stringify(err));
                }, { frequency: 200 });
            
            app.watchID = navigator.accelerometer.watchAcceleration(function(accel) {     
                var diffX = Math.round(Math.abs(accel.x - app.prevAccel.x));
                var diffY = Math.round(Math.abs(accel.y - app.prevAccel.y));
                var diffZ = Math.round(Math.abs(accel.z - app.prevAccel.z));
                var diffM = Math.round(Math.abs(app.currentHeading - app.prevAccel.m));

                app.prevAccel.x = accel.x;
                app.prevAccel.y = accel.y;
                app.prevAccel.z = accel.z;
                app.prevAccel.m = app.currentHeading;

                var newLogText = 
                    "dX:"
                    + diffX.toString()
                    + ",dY:"
                    + diffY.toString()
                    + ",dZ:"
                    + diffZ.toString()
                    + ",dM:"
                    + diffM.toString()
                    /*+ ",X:"
                    + Math.round(accel.x).toString()
                    + ",Y:"
                    + Math.round(accel.y).toString()
                    + ",Z:"
                    + Math.round(accel.z).toString()
                    + ",H:"
                    + Math.round(app.currentHeading).toString()*/
                    ;
                app.doLog(newLogText);

                var enableAccel = $("#EnableAccel").is(":checked");
                if (enableAccel && (diffX > 1 || diffY > 1 || diffZ > 1 || (diffM > 30 && diffM < 330)))
                {                        
                    app.isMoving = true;
                }
                else {
                    app.isMoving = false;
                }
            },
            function (message) {
                console.log('Failed because: ' + message);
                app.addHistory(message);
            },
            { frequency: 200 });
            
            $("#StopCount").text("Click to stop");
            navigator.vibrate(250);
        });
        
    $("#GoLog").click(function() {
        $("#ButtonsPanel").hide();
        $("#LogPanel").show();
        return false;
    });
    
    $("#GoButtons").click(function() {
        $("#LogPanel").hide();
        $("#ButtonsPanel").show();        
        return false;
    });
});