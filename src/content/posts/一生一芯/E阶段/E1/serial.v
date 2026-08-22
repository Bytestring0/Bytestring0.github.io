module top_module(
    input clk,
    input in,
    input reset,    // Synchronous reset
    output [7:0] out_byte,
    output done
); 
parameter IDLE = 0, START = 1, DATA = 2, STOP = 3,ERR = 4;
reg [2:0] state, next_state;
integer count = 0;
reg [7:0] buffer;
reg [8:0] check;
reg flag;
always @(posedge clk) begin
    if (reset) begin
        state  <= IDLE;
        count  <= 0;
        buffer <= 0;
        check  <= 0;
        flag   <= 0;
    end else begin
        if (state == DATA || state == START) begin
            if (count < 9) begin                    
                if(count < 8)
                    buffer <= (buffer >> 1) | (in << 7);      
                if(count == 8)begin
                    check = {in,buffer};
                    flag  = ^check;
                end
                count  <= count + 1;
            end
        end else begin
            count  <= 0;
            buffer <= 0;   
        end
        state <= next_state;
    end
end

always @(*)begin
    next_state = state;
    case(state)
        IDLE:
            if(in == 0)
                next_state = START;
        START:
            next_state = DATA;
        DATA:
            if(in == 1 && count == 9)
                next_state = STOP;
            else if(count >=9)
                next_state = ERR;
        STOP:
            if(in == 0)
                next_state = START;
            else
                next_state = IDLE;
        ERR:
            if(in == 1)
                next_state = IDLE;
            else
                next_state = ERR;
    endcase
end

assign done = flag && (state == STOP) && (count == 9);
assign out_byte = buffer;
endmodule
