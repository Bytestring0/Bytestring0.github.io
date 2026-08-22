module top_module(
    input clk,
    input areset,    // Freshly brainwashed Lemmings walk left.
    input bump_left,
    input bump_right,
    input ground,
    input dig,
    output walk_left,
    output walk_right,
    output aaah,
    output digging ); 

parameter LEFT = 0,
          RIGHT = 1,
          FALL = 2,
          DIG = 3;
reg [1:0] state, next_state;
reg [1:0] fall_dir;
reg flag;
integer count = 0;
always @(*) begin
    next_state = state;
    case(state)
        LEFT:
            if(!ground)
                next_state = FALL;
            else if(dig)
                next_state = DIG;
            else if(bump_left)
                next_state = RIGHT;
        RIGHT:
            if(!ground)
                next_state = FALL;
            else if(dig)
                next_state = DIG;
            else if(bump_right)
                next_state = LEFT;
        FALL:
            if(ground)
                next_state = fall_dir;
        DIG:
            if(!ground)
                next_state = FALL;
    endcase
end

always @(posedge clk,posedge areset) begin
    if(areset) begin
        state <= LEFT;
        fall_dir <= LEFT;
        flag <= 0;
        count <= 0;
    end
    else begin
        if(state == FALL)
            count <= count + 1;
            if(count >= 20 && next_state != FALL)
                flag <= 1;
            else if(next_state != FALL)
                count <= 0;
        if(next_state == FALL || next_state == DIG)
            if(state == LEFT || state == RIGHT)
                fall_dir <= state;
        state <= next_state;
    end
end

assign walk_left = flag ? 0 : (state == LEFT);
assign walk_right = flag ? 0 : (state == RIGHT);
assign aaah = flag ? 0 : (state == FALL);
assign digging = flag ? 0 : (state == DIG);
endmodule
