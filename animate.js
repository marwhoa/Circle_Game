/* Name: Aaron Marlowe
   Date: 4-06-17
   Class: CSC-3360
   Project: Bouncing Circle Game
   URL: linus.highpoint.edu/~jmarlowe/csc3360/private/moveCircle/moveCircle.html
   Controls:
        To begin, move your mouse inside the canvas. The game will then start. You control the circle by 
	moving the mouse inside the canvas (the user's circle will not go outside the canvas) 
   Description:
	The following is the javascript code for the Bouncing Circle Game. The Game uses a circle_type class
	to store the data for the circle bouncing on the screen, and a user_type class which inherits from
	circle_type to represent the circle the player controls.
	The game starts on level One, with 4 circles, then moves to level Two, with 8 circles, and
	finally ends on level three, with 16 pre-specified circles.
	The circles are colored red if the user can't consume them, and green otherwise.
	If the user consumes a green circle, the green circle disappears, and the user circle's radius
	grows by a certain amount. If the user touches a red circle, the game terminates with Game Over.
*/

//------------------------------ Global Variables ----------------------------------//

var ptsVertexPosBuffer;
var ptsVertexColorBuffer;
const TwoPI = 2*Math.PI;
var circlePts=[];  //Unit circle pts
var gl;
var program;
var circles = [] //Holds the red and green circles. circles[0] is always the user's circle

/*shader stuff - 
 * a prefix is for an attribute in the vertex shader - tied to array buffer
 * You can think of these as references(addresses) to data stored in the GPU. 
 *
 * u prefix is for a uniform variable in the vertex shader. For a shader uniforms 
 * are values passed to the shader that stay the same for all vertices in a draw call.
 */
var uProjMat;    //projection matrix, attribute type variable
var uCircleSize; //uniform variable, 
var uCirclePos; //uniform variable
var aCirclePts;  //location of all Unit circle pts in ARRAY_BUFFER
var uCircleColor; 

var world_lt = -2.0; //to be used by ortho command
var world_rt = 2.0;
var world_bt = -2.0;
var world_top = 2.0;
var world_near = 2.0;
var world_far = -2.0;


var initialUserRadius = 0.10; //The initial radius of the user's circle
var mouseWorldX = -5;
var mouseWorldY = -5;
var canvas;
var then = 0; //used by frame rate


var userCircle;
var gameStart = false; 
var gameOver = false;
var level = 1;

var white = vec4(1.0, 1.0, 1.0, 1.0); //constant colors to be used by circles
var red = vec4(1.0, 0.0, 0.0, 1.0);
var green = vec4(0.0, 1.0, 0.0, 1.0);

//--------------------------------End Global Variables ------------------------------//



class circle_type {
   constructor(position,dir,radius,color,speed) 
   {
      this.position = position;   //location of the center of the circle in world space
      this.dir = normalize(dir);             //direction and magnitude (length of vector)

      this.radius = radius;       //size of circle
      this.color = color;
      this.speed = speed;
      this.live = false; //determines whether the circle is completely on the canvas or not
   }
   
   isLive() //is the circle within the canvas entirely?
   {
      return this.live;
   } 

   getSpeed() //return the circle's speed
   {
      return this.speed;
   }

   setSpeed(newSpeed) //give the circle a new speed
   {
      this.speed = newSpeed; 
   }

   getRadius() //return the circle's radius
   {
      return this.radius;
   }

   getPosition() //return the circle's vec2 position
   {
      return vec2(this.position[0], this.position[1]);
   }

   getColor()
   {
      return this.color;
   }
   setColor(vec4Val)
   {
      this.color = vec4Val;
   }

   //deltaTime is the time differences used to calculate frameRate
   //This function updates the circle's position based on its speed and direction vectors.
   //It also updates the circle "liveness" if it isn't in the canvas entirely already
   takeAStep(deltaTime)                   
   {
      var stepsize = scale(this.speed * deltaTime, this.dir);
       
      this.position = add(this.position, stepsize);

      if(!(this.isLive()))
      {
	 if((this.getRadius() + this.getPosition()[0] < world_rt) && (this.getPosition()[0] - this.getRadius()  > world_lt))
	 {
	    if((this.getRadius() + this.getPosition()[1] < world_top) && (this.getPosition()[1] - this.getRadius() > world_bt))
	    {
		this.live = true;
	    }
	 }
      }

      return this.position;
   }

   
   getNextPosition(deltaTime)
   {
      var stepsize = scale(this.speed * deltaTime, this.dir);

      return add(this.position, stepsize);
   }
   changeXDir() //make the circle go the other way in the x-direction. used for collision with the canvas
   {
      this.dir[0] *= -1;
   }
   changeYDir() //make the circle go the other way in the y-direction. Used for collision with the canvas
   {
      this.dir[1] *= -1;
   }
   getDirection()
   {
      return this.dir;
   }
   setDirection(newDir)
   {
      this.dir = newDir
   }
}


//Class used specifically for the user's mouse
class user_type extends circle_type {
 
   constructor(position, radius) { //dir not needed

      super(position, 0, radius, white, 0); //call parent constructor
   }

   //Function to change the user's circle position
   setPosition(newX, newY)
   {
      this.position = vec2(newX, newY);
   }
   
   setRadius(newRad)
   {
      this.radius = newRad;
   }
}



//go ahead and push the user's circle, so it will be at circles[0]
userCircle = new user_type(vec2(-2, -2), initialUserRadius, white); //X
circles.push(userCircle);


/*
 *levelOne(void)
 * preCondition - circles array is empty except for user circle
 * postCondition - 5 total circles are in circles array
 * description - set up for level One of game
 */
function levelOne()
{
  var IR = initialUserRadius;

  var circleA = new circle_type(vec2(.5, world_top + 1.0), vec2(-0.01, -0.005), IR/1.5, red, 1.1); //A
  var circleB = new circle_type(vec2(0.5,world_bt - 1.0), vec2(0.004, 0.006), IR - 0.05, red, 1.0); //B
  var circleC = new circle_type(vec2(world_lt - 1.0 ,0.4), vec2(.007, -0.006), (IR-0.05) + circleA.getRadius() + circleB.getRadius(), red, 0.7); //C
  var circleD = new circle_type(vec2(world_rt + 1.0,0.5), vec2(-.006, 0.001), IR+circleA.getRadius()+circleB.getRadius()+circleC.getRadius(),red, 1.0);

  circles.push(circleA);
  circles.push(circleB);
  circles.push(circleC);
  circles.push(circleD);
 
}

/*
 * levelTwo(void)
 * preCondition - circles array is empty except for user circle
 * postCondition - 9 total circles are in circles array
 * description - set up for level Two  of game
 */
function levelTwo()
{
   var IR = initialUserRadius;
   userCircle.setRadius(IR);

  var circleA = new circle_type(vec2(.1, world_top + 0.25), vec2(-0.01, -0.005), IR/1.2, red, 1.1); //A
  var circleA1 = new circle_type(vec2(.8, world_top + 0.35), vec2(-0.02, -0.006), IR/1.3, red, 1.1); //A1
  var circleA3 = new circle_type(vec2(.5, world_top + 0.10), vec2(0.02, -0.008), IR + 0.2, red, 0.95); //A1
 
  var circleB = new circle_type(vec2(0.1,world_bt - 0.4), vec2(0.004, 0.006), IR, red, 1.0); //B
  var circleB1 = new circle_type(vec2(.7, world_bt - 0.25), vec2(0.004, 0.005), IR, red, 0.95); //B1
  var circleB2 = new circle_type(vec2(.5, world_bt - 0.1), vec2(-0.006, 0.004), IR + 0.15, red, 1.05); //A1


  var circleC = new circle_type(vec2(world_lt - 0.12 ,0.3), vec2(.007, 0.003), IR + circleA.getRadius() + circleB.getRadius(), red, 0.85); //C

  var circleD = new circle_type(vec2(world_rt + 0.34,0.2), vec2(-.006, 0.001), IR+circleA.getRadius(),red, 1.05);

  circles.push(circleA);
  circles.push(circleA1);
  circles.push(circleA3);

  circles.push(circleB);
  circles.push(circleB1);
  circles.push(circleB2);

  circles.push(circleC);
  circles.push(circleD);

}


/*
 *levelThree(void)
 * preCondition - circles array is empty except for user circle
 * postCondition - 17 total circles are in circles array
 * description - set up for level Three of game
 */
function levelThree()
{

  var IR = initialUserRadius;
  userCircle.setRadius(IR);

  var circleA = new circle_type(vec2(.1, world_top + 0.25), vec2(-0.01, -0.005), IR/1.2, red, 1.1); //A
  var circleA2 = new circle_type(vec2(.3, world_top + 0.10), vec2(-0.05, -0.0055), IR/1.2, red, 1.15); //A
  var circleA1 = new circle_type(vec2(.8, world_top + 0.35), vec2(-0.02, -0.006), IR/1.3, red, 1.1); //A1
  var circleA3 = new circle_type(vec2(.5, world_top + 0.10), vec2(0.02, -0.008), IR + 0.2, red, 0.95); //A1

  var circleB = new circle_type(vec2(0.1,world_bt - 0.4), vec2(0.004, 0.006), IR, red, 1.0); //B
  var circleB1 = new circle_type(vec2(.7, world_bt - 0.25), vec2(0.004, 0.005), IR, red, 0.95); //B1
  var circleB2 = new circle_type(vec2(.3, world_bt - 0.5), vec2(-0.007, 0.004), IR + 0.25, red, 0.9); //B2
  var circleB3 = new circle_type(vec2(.5, world_bt - 0.1), vec2(-0.006, 0.004), IR + 0.15, red, 1.05); //B2


  var circleD = new circle_type(vec2(world_rt + 0.34,0.2), vec2(-.006, 0.001), IR+circleA.getRadius(),red, 1.05);
  var circleD1 = new circle_type(vec2(world_rt + 0.5 ,0.6), vec2(-.004, -0.0045), IR - 0.01 ,red, 0.85);
  var circleD2 = new circle_type(vec2(world_rt + 0.05,0.8), vec2(-.003, 0.004), IR - 0.15 ,red, 0.7);
  var circleD3 = new circle_type(vec2(world_rt + 0.5,0.4), vec2(-.005, 0.003), IR + 0.03  ,red, 0.95);


  var circleC = new circle_type(vec2(world_lt - 0.25 ,0.2), vec2(.007, 0.002), IR + 0.4, red, 0.85); //C
  var circleC1 = new circle_type(vec2(world_lt - 0.1 ,0.5), vec2(.005, -0.004), IR - 0.05 ,red, 1.08);
  var circleC2 = new circle_type(vec2(world_lt - 0.5 ,0.8), vec2(.003, -0.0075), IR + 0.01, red, 1.05);
  var circleC3 = new circle_type(vec2(world_lt - 0.45 ,0.9), vec2(.005, 0.004), IR + 0.15, red, 1.0);
 

  circles.push(circleA);
  circles.push(circleA1);
  circles.push(circleA2);
  circles.push(circleA3);

  circles.push(circleB);
  circles.push(circleB1);
  circles.push(circleB2);
  circles.push(circleB3);

  circles.push(circleC);
  circles.push(circleC1);
  circles.push(circleC2);
  circles.push(circleC3);

  circles.push(circleD);
  circles.push(circleD1);
  circles.push(circleD2);
  circles.push(circleD3);

}



/* setLevelText(text)
*  text - argument of type String to display below the canvas
*  description - This function is used to display level information of the game below the canvas
*/
function setLevelText(text)
{
   var rect = document.getElementById("level-canvas");
   var ctx = rect.getContext("2d");

   ctx.clearRect(0, 0, rect.width, rect.height);

   ctx.font = "30px Verdana";
   ctx.textAlign = 'left';
   var gradient = ctx.createLinearGradient(200,0,rect.width,0);

   gradient.addColorStop("0","magenta");
   gradient.addColorStop("0.5","blue");
   gradient.addColorStop("1.0","red");

   ctx.fillStyle = gradient;
   ctx.fillText(text, 200, 50);
}


//Function to set up a mouseListener event on the canvas
//mouseMove is the function to use as lsitener
function setupListener(canvas)
{
   canvas.addEventListener("mousemove", mouseMove);
   rect = canvas.getBoundingClientRect();
}


//Function added by setupListener that gets triggered when the user's mouse moves on the canvas
//The user circle's position will only get updated if the mouse is inside the canvas
//In the case of level one, the game doesn't start until the user's mouse is inside the canvas
function mouseMove(e)
{
   var x = e.clientX - rect.left;
   var y = e.clientY - rect.top;
   mouseWorldX = world_lt + (x/canvas.width) * (world_rt - world_lt);
   mouseWorldY = world_top - (y/canvas.height) * (world_top - world_bt);

   if((mouseWorldX + userCircle.getRadius() < world_rt) && (mouseWorldX - userCircle.getRadius() > world_lt))
   {
      if((mouseWorldY + userCircle.getRadius() < world_top) && (mouseWorldY - userCircle.getRadius() > world_bt))
      {
	 userCircle.setPosition(mouseWorldX, mouseWorldY); //set the new position

	 if(!gameStart)
   	 {
	    console.log("Starting game!");
	    gameStart = true;
	    webGLStart();
	 }
      }
   }
}



//Function that gets called by animate.html to setup code for the game
function initiateScript()
{
   //set up mouse tracking events
   canvas = document.getElementById("gl-canvas");
   rect = canvas.getBoundingClientRect();
   
   //setup the mouse tracking events
   setupListener(canvas);
}


/* function collide(circle1, circle2)
 * circle1 - parameter of type circle_type
 * circle2 - parameter of type circle_type
 * description - 
 * 	This function is responsible for handling the actual colision of two circle_type circles
 */
function collide(circle1, circle2)
{
   var u = add(circle2.getPosition(), scale(-1,circle1.getPosition()));
   var uNorm = normalize(u);


   var uTan = vec2(-1 * uNorm[1], uNorm[0]); //vector
   uNorm = vec2(uNorm[0], uNorm[1]);
   

   var v1 = scale(circle1.getSpeed(), circle1.getDirection());
   var v2 = scale(circle2.getSpeed(), circle2.getDirection());
  
   var m1 = circle1.getRadius();
   var m2 = circle2.getRadius();

   var v1n =  dot(uNorm, v1);
   var v1t = dot(uTan, v1);


   var v2n = dot(uNorm, v2);
   var v2t = dot(uTan, v2);


   var v1Prime = ((v1n * (m1-m2)) + (2*m2*v2n))/(m1 + m2);
   var v2Prime = ((v2n * (m2-m1)) + (2*m1*v1n))/(m1 + m2);

   var newV1 = add(scale(v1Prime, uNorm), scale(v1t, uTan));
   var newV2 = add(scale(v2Prime, uNorm),  scale(v2t, uTan));

   //set the new directions for each respective circle
   circle1.setDirection(newV1);
   circle2.setDirection(newV2);
}


/* function genPts(a,c,circlePts,i)
 * i - number of iterations to generate for circle
 * circlePts - array to push points into
 * a - vec2 Point
 * b - vec2 Point
 * description - generates the number of pooints necessary to generate a circle onto the canvas
 */
function genPts(a,c,circlePts,i)
{
   if(i==0) {
      circlePts.push(a);
   } else {
      var b;
      b = mix(a,c,0.5);
      b = normalize(b);
      genPts(a,b,circlePts,i-1);
      genPts(b,c,circlePts,i-1);
   }
}


//Function, given circlePts array to push to and the number of iterations to go,
//will generate the points to draw the specified circle to the canvas. 
function genCircle(circlePts, iterations)
{
   var base_pts = [vec2(0.0, 1.0),
                   vec2(-1.0, 0.0),
                   vec2(0.0, -1.0),
                   vec2(1.0, 0.0)];

   genPts(base_pts[0],base_pts[1],circlePts,iterations);
   genPts(base_pts[1],base_pts[2],circlePts,iterations);
   genPts(base_pts[2],base_pts[3],circlePts,iterations);
   genPts(base_pts[3],base_pts[0],circlePts,iterations);
 
}



//function to return the distance between two vec2 Points d1 and d2
function distance(d1, d2)
{
   return Math.sqrt(Math.pow(d2[0] - d1[0], 2) + Math.pow(d2[1] - d1[1], 2))
}


/* checkForCollision(i, delta)
 * i - index of the circle you are checking in the circles array
 * delta - timing difference between variables then and now
 * description - The function iterates through the circles array using iterator j, and checks
 *	         to see if circle[i] and collided with circles[j]
 * 		 if so, it calls collide function
 *
 */
function checkForCollision(i, delta)
{
   var radius = circles[i].radius;
   var nextPosition = circles[i].getNextPosition(delta);

   for(var j = i+1; j < circles.length; j++)
      {
         var otherNextPos = circles[j].getNextPosition(delta);

         if((radius + circles[j].radius) >=  distance(nextPosition, otherNextPos))
         {
            if(circles[i].isLive() && circles[j].isLive())
            {
               console.log("COLLISION");
               collide(circles[i], circles[j]);
            }
         }
      }
}


/* checkForUserCircleContact(i, delta)
 * i - index for circle of interest in circles array
 * delta - variable for frame rate interests
 * description - Checks if the user circle has collided with circle[i].
 * 		 If the circle[i] is green, it is absorbed
 *		 Otherwise, it's game over
 *
 */
function checkForUserCircleContact(i, delta)
{
   var radius = userCircle.getRadius();
   var position = userCircle.getPosition();

   if((radius + circles[i].getRadius()) >= distance(position, circles[i].getPosition()))
   {
      if(circles[i].getColor() == green)
      {

         if(circles[i].isLive())
         {
            userCircle.setRadius(radius + circles[i].getRadius()/(level));
	    circles.splice(i, 1); //remove circle
	    return true;
         }
      }
      else
      {
	 setLevelText("GAME OVER");
         gameOver = true;
	 return false;
      }
   }

   return false;
}



//update function that gets called at every render
function update(delta)
{ 

   for(var i = 1; i < circles.length; i++) //Index 1 in circles array is for userCircle
   {
      var radius = circles[i].radius;
      var nextPosition = circles[i].getNextPosition(delta);

      if(!checkForUserCircleContact(i, delta))
      {
         checkForCollision(i, delta);

	 //if the circle is within the canvas, and it's about to hit the right or left wall, change its x-diredction
         if( (nextPosition[0] + radius >= world_rt) || (nextPosition[0] - radius <=  world_lt))
         {
	    if(circles[i].isLive())
	    {
               circles[i].changeXDir();
	    }
         }
    
	 //if the circle is within the canvas, and it's about to hit the top or bottom wall, change its y-direction
         if( (nextPosition[1] + radius >= world_top) || (nextPosition[1] - radius <= world_bt))
         {
	    if(circles[i].isLive())
	    {
	       circles[i].changeYDir();
	    }
         }
      
         circles[i].takeAStep(delta); //update the ith circle's position

         //If the individual circle is smaller than the user's circle, set the color to
         //green. Otherwise, set it to red.
         if(circles[i].getRadius() <= userCircle.getRadius())
         {
	    circles[i].setColor(green);
         }
         else
         {
	    circles[i].setColor(red);
         }
 
      }
      else
      {
	 i = i - 1; //accomodate the array being modified
      }
   }

}



function initBuffers()
{
   //only need to connect uniform variables one time 
   var numPts = circlePts.length; 
  
   //load ARRAY_BUFFER with the points to form a Unit circle
   //NOTE: we can reuse these points many times to render
   //a variety of circles on the canvas.
   ptsVertexPosBuffer = gl.createBuffer(); 
   gl.bindBuffer(gl.ARRAY_BUFFER, ptsVertexPosBuffer); 
   gl.bufferData(gl.ARRAY_BUFFER, flatten(circlePts), gl.STATIC_DRAW); 
   ptsVertexPosBuffer.itemSize = 2; //two floats per point
   ptsVertexPosBuffer.numItems = numPts; 


   // Associate our shader variables with our data buffer
   //local reference to something in the vertex shader
   //attributes behave differently than uniform variables
   aCirclePts = gl.getAttribLocation( program, "aCirclePts" );
   gl.vertexAttribPointer( aCirclePts, ptsVertexPosBuffer.itemSize, gl.FLOAT, false, 0, 0 );

 
   gl.bindBuffer(gl.ARRAY_BUFFER,null);


   //Get the locations of transformation matrices from the vshader
   uProjMat = gl.getUniformLocation(program, "uProjMat"); //connection to vertex shader variable
   var projectionMatrix=ortho(-2.0,2.0,-2.0,2.0,-2.0,2.0); //define the view volume
   gl.uniformMatrix4fv(uProjMat, false, flatten(projectionMatrix)); //feed the projection matrix into the vertex shader


   //Get the locations of the scale and position from the vshader
   //These will be filled as the program runs, the vshader will
   //use these to values to correctly size and position the circle.
   uCircleSize = gl.getUniformLocation(program, "uCircleSize");
   uCirclePos = gl.getUniformLocation(program, "uCirclePos");
   uCircleColor = gl.getUniformLocation(program, "uCircleColor");
}


function render(now)
{
   var deltaTime;
   gl.clear( gl.COLOR_BUFFER_BIT );

   //render the circle
   gl.bindBuffer(gl.ARRAY_BUFFER, ptsVertexPosBuffer);
   gl.enableVertexAttribArray( aCirclePts );


   //tell the vertex shader location and size of the circle to render
   //through circle radius into uCircleSize

   for(var i = 0; i < circles.length; i++)
   {
      gl.uniform1f(uCircleSize, circles[i].radius); //1f = 1 float. circle size is 1 float
      gl.uniform2fv(uCirclePos, flatten(circles[i].getPosition())); //2fv = 2 Float Vector
      gl.uniform4fv(uCircleColor, circles[i].getColor());

      gl.drawArrays( gl.LINE_LOOP, 0, ptsVertexPosBuffer.numItems);

      //tell the vertex shader location and size of the circle to render
      //gl.uniform1f(uCircleSize, circles[i].getRadius());
      //gl.uniform2fv(uCirclePos, flatten(circles[i].getPosition()));
      //gl.drawArrays( gl.LINE_LOOP, 0, ptsVertexPosBuffer.numItems);
   }

   gl.disableVertexAttribArray( aCirclePts );
   gl.bindBuffer(gl.ARRAY_BUFFER,null);

   now *= .001;
   deltaTime = now - then;
   then = now;
   update(deltaTime) //update circle positions

   if(circles.length == 1) //you've eaten all other circles
   {
      level++;
      circlePts = [];
      
      if(level < 4)
      {
         setLevelText("Level " + level);
 	 console.log("Level " + level);
	
         if(level == 2)
            levelTwo();
         else
	    levelThree();

         genCircle(circlePts, circles.length);

         initBuffers();
         window.requestAnimationFrame(render);
      }
      else
      {
	 setLevelText("YOU WIN!");
	 gameOver = true;
      }

   }
   else if(!gameOver)
      window.requestAnimationFrame(render)
}



function webGLStart()
{
   // Configure WebGL
   
   gl = initGL(canvas);
   if(gl) {
      gl.viewport( 0, 0, gl.viewportWidth, gl.viewportHeight);
      gl.clearColor(0.0,0.0,0.0, 1.0 );
      gl.enable(gl.DEPTH_TEST);
   
      //  Load shaders 
      program = initShaders(gl);
      gl.useProgram(program);

      setLevelText("Level " + level);
      levelOne();
      genCircle(circlePts, circles.length);
      // load the data into the GPU, i.e. Initialize buffers 
      initBuffers();

      console.log("Rendering");
      window.requestAnimationFrame(render);

   } else {
      alert("Failed to initialize webGL in browser - exiting!");
   }
}
