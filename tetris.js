//virtual keyboard
//arrow keys
var VK_UP = 38,
    VK_DOWN = 40,
    VK_LEFT = 37,
    VK_RIGHT = 39;
    
//all the tetris BLOCK_SHAPES
var BLOCK_SHAPES = [];
BLOCK_SHAPES[0] = [ //I
    [1,1,1,1]
    ];
BLOCK_SHAPES[1] = [ //J
    [1,0,0,0],
    [1,1,1,1]
    ];
BLOCK_SHAPES[2] = [ //L
    [1,1,1,1],
    [1,0,0,0]
    ];
BLOCK_SHAPES[3] = [ //O
    [1,1],
    [1,1]
    ];
BLOCK_SHAPES[4] = [ //S
    [0,1,1],
    [1,1,0]
    ];
BLOCK_SHAPES[5] = [ //T
    [1,1,1],
    [0,1,0]
    ];
BLOCK_SHAPES[6] = [ //Z
    [1,1,0],
    [0,1,1]
    ];

//main tetris object
var tetris = {};
//quick reference to the canvas
var $canvas = undefined;

tetris.startGame = function(element) {
    console.log("starting");  
    
    //save canvas element
    $canvas = $(element);
    
    //key listener
    tetris.keys = [];
    //init arrow keys so they are not undefined
    tetris.keys[VK_UP] = false;
    tetris.keys[VK_DOWN] = false;
    tetris.keys[VK_LEFT] = false;
    tetris.keys[VK_RIGHT] = false;
    //bind key events
    $(document).keydown(function(event) {
        tetris.keys[event.keyCode] = true;
    });
    $(document).keyup(function(event) {
        tetris.keys[event.keyCode] = false;
        
        // if up is pressed - then rotate current shape
        if(event.keyCode == VK_UP)
        {
            rotateCurrentShape();
        }
    });
    
    
    //grab final width and height
    tetris.width = $(element).width();
    tetris.height = $(element).height();
    
    //create an empty array of blocks (that defines all the solid blocks)
    solidBlocks = new Array(COUNT_ROWS);
    for(var i=0; i<solidBlocks.length; i++)
    {
        solidBlocks[i] = new Array(COUNT_COLS);
    }
    
    
    
    //sets the const vars
    FALL_RATE = FALL_RATE * (tetris.height / 100);
    
    //create an initial shape 
    newRandomShape();
    
    //start the game loop
    setInterval(tetris.gameloop, 1000 / FPS);
    
    console.log("Started!");
};

//frames/updates per second
var FPS = 15;
// rate in which the BLOCK_SHAPES fall
var FALL_RATE = 2;

//how many rows (horizontal axis)
var COUNT_ROWS = 18;
//how many columns (vertical axis)
var COUNT_COLS = 10;

//background colour
var CLEAR_COLOR = "#FFFFFF";

//a list of all the solid blocks
var solidBlocks;

//the current shape that is moving down
var currentShape;

//keeps track when the current shape should move down
var next_move_down = FPS;

tetris.gameloop = function() {
    
    next_move_down--;
    if(tetris.keys[VK_DOWN]) //if the user has the down key pressed
    {
        moveCurrentShape(0, 1);
        next_move_down = FPS;
    }
    if(tetris.keys[VK_RIGHT])
    {
        moveCurrentShape(1, 0);
    }
    if(tetris.keys[VK_LEFT])
    {
        moveCurrentShape(-1, 0);
    }
    /* //THIS IS NOW DONE VIA AN EVENT LISTENER
    if(tetris.keys[VK_UP])
    {
        //rotate block
        //rotateCurrentShape();
    }
    */
    
    //force moving down
    if(next_move_down <= 0) //time to move the shape
    {
        //move the current shape down
        moveCurrentShape(0, 1);
        
        next_move_down = FPS;
    }
    
    //clear the display
    $canvas.clearCanvas();
    
    //draw bg colour
    $canvas.drawRect({
        fillStyle: CLEAR_COLOR,
        x: 0, y: 0,
        width: tetris.width,
        height: tetris.height,
        fromCenter: false
    });
    
    currentShape.draw();
    
    
    //draw all the solid blocks
    for(var i=0; i<solidBlocks.length; i++)
    {
        for(var j=0; j<solidBlocks[i].length; j++)
        {
            var b = solidBlocks[i][j];
            if(typeof b !== 'undefined')
            {
                drawBlock(j, i, b);
            }
        }
    }
    
    
    drawGrid();
    
    console.log(solidBlocks);
};


function rotateCurrentShape()
{
    //TODO needs work
    
    //need to take the block array and rotate it.
    var origBlocks = currentShape.blocks;
    
    var newBlocks = new Array(origBlocks[0].length);
    
    for(var i=0; i<newBlocks.length; i++)
    {
        newBlocks[i] = new Array(origBlocks.length);
        
        for(var j=0; j<newBlocks[i].length; j++)
        {
            newBlocks[i][j] = origBlocks[newBlocks[i].length -1 -j][i];
        }
    }
    
    //assign it the newly rotated blocks
    currentShape.blocks = newBlocks;
    
    //save the original position
    var origXPosition = currentShape.position[0];
    
    var positionMoved = false;
    //make sure it does not extend outside the boundaries (to the right)
    while( !(currentShape.position[0] + currentShape.blocks[0].length < COUNT_COLS))
    {
        currentShape.position[0]--;
        positionMoved = true;
    }
    
    //check to ensure that it does not conflict with any blocks after moving
    if(positionMoved && !areaClear(currentShape.position[0], currentShape.position[1]))
    {
        //revert back to original position
        currentShape.position[0] = origXPosition;
    }
    
    
    
    
    //ensure that this will not conflict with any other blocks
    if(!areaClear(currentShape.position[0], currentShape.position[1]))
    {
        //then revert it back to original state
        currentShape.blocks = origBlocks;
        
    }
    
    
    
}

//attempts to move the current block in either x or y
function moveCurrentShape(x, y) {
    
    if(x < 0) //if moving left
    {
        if(currentShape.position[0] > 0 && areaClear(currentShape.position[0]-1, currentShape.position[1]))
        {
            currentShape.position[0]--;
        }
    }
    else if(x > 0)//if moving right
    {
        if(currentShape.position[0] + currentShape.blocks[0].length < COUNT_COLS && areaClear(currentShape.position[0]+1, currentShape.position[1]))
        {
            currentShape.position[0]++;
        }
    }
    else if(y > 0) //moving down
    {
        var safeToMoveDown = true;
        
        //detect block collisions (ie if this shape can't move down because another block is there
        
        //loop through the block and see if any of the pieces clash with another piece
        var currentX = currentShape.position[0];
        var currentY = currentShape.position[1] + 1; //because we want to move down, add 1 to Y
        
        if(currentShape.position[1] + currentShape.blocks.length < COUNT_ROWS && areaClear(currentX, currentY))
        {
            currentShape.position[1]++;
        }
        else //the shape has reached the bottom or has hit a piece so set it in place
        {
            finishCurrentShape()
        }
    }
    
}


// checks if the currentShape can move into a new area and not have any conflicts 
// params are the new position for the currentShape
function areaClear(positionX, positionY)
{
    var safeToMove = true;
    
    for(var i=0; i<currentShape.blocks.length; i++)
    {
        for(var j=0; j<currentShape.blocks[i].length; j++)
        {
            var x = positionX + j;
            var y = positionY + i;
            
            if(currentShape.blocks[i][j] === 1 && typeof solidBlocks[y][x] !== 'undefined' )
            {
                safeToMove = false;
            }
        }
    }
    
    return safeToMove;
}


//removes the current shape (puts it into the solid blocks) and creates a new one
function finishCurrentShape()
{
    for(var i=0; i<currentShape.blocks.length; i++)
    {
        for(var j=0; j<currentShape.blocks[i].length; j++)
        {
            var x = currentShape.position[0] + j;
            var y = currentShape.position[1] + i;
            if(currentShape.blocks[i][j] === 1)
            {
                solidBlocks[y][x] = currentShape.color;
            }
            console.log("" + x + "," + y);
        }
    }
    
    //check if a line has been completed
    for(var i=0; i<solidBlocks.length; i++)
    {
        var rowComplete = true;
        for(var j=0; j<solidBlocks[i].length; j++)
        {
            if(typeof solidBlocks[i][j] === 'undefined')
            {
                rowComplete = false;
            }
        }
        
        if(rowComplete)
        {
            console.log("COMPLETE");
            for(var j=0; j<solidBlocks[i].length; j++)
            {
                solidBlocks[i][j] = "#FF00FF";
            }
        }
    }
    
    
    console.log("new shape");
    
    newRandomShape();
}


function newRandomShape()
{
    //TODO could adjust values based on how often a shape spawns
    
    
    currentShape = new TetrisShape(BLOCK_SHAPES[Math.floor(Math.random() * BLOCK_SHAPES.length)], "#FF0000");
}


//creates a new tetris shape
function TetrisShape(blocks, color)
{
    this.blocks = blocks;
    this.color = color;
    this.position = [0,0];
    this.draw = function() {
        drawTetrisShape(this);
    };
    
}


//draw a complete tetris shape
function drawTetrisShape(shape)
{
    for(var row=0; row<shape.blocks.length; row++)
    {
        for(var col=0; col<shape.blocks[row].length; col++)
        {
            if(shape.blocks[row][col] == 1)
            {
                var xPos = (shape.position[0] + col);// * (tetris.width / COUNT_COLS);
                var yPos = (shape.position[1] + row);// * (tetris.height / COUNT_ROWS);
                
                drawBlock(xPos, yPos, shape.color);
            }
        }
    }
}


//draws a single block
function drawBlock(xPos, yPos, color)
{
    xPos *= (tetris.width / COUNT_COLS);
    yPos *= (tetris.height / COUNT_ROWS);
    
    $canvas.drawRect({
        fillStyle: color,
        x: xPos, y: yPos,
        width: tetris.width / COUNT_COLS,
        height: tetris.height / COUNT_ROWS,
        fromCenter: false
    });
}




//debug function to display grid
function drawGrid() {
    
    for(var row=0; row < COUNT_ROWS; row++)
    {
        var yHeight = tetris.height / COUNT_ROWS * row;
        $canvas.drawLine({
            strokeStyle: "#000000",
            strokeWidth: 1,
            x1: 0, y1: yHeight,
            x2: tetris.width, y2: yHeight
        });
    }
    
    for(var col=0; col < COUNT_COLS; col++)
    {
        var xWidth = tetris.width / COUNT_COLS * col;
        $canvas.drawLine({
            strokeStyle: "#000000",
            strokeWidth: 1,
            x1: xWidth, y1: 0,
            x2: xWidth, y2: tetris.height
        });
    }
}

