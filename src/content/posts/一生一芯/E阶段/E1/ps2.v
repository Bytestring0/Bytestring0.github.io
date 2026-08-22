module top_module(
    input clk,
    input [7:0] in,
    input reset,    // Synchronous reset
    output [23:0] out_bytes,
    output done); //

    parameter R0=0,R1 = 1,R2 = 2,R3 = 3;
    reg [1:0] state, next_state;
    // State transition logic (combinational)
    reg [23:0] buffer;
    always @(posedge clk) begin
        if(reset)begin
            state <= R0;
        end
        else begin
            if(state == R0 && in[3] == 1)begin
                state <= R1;
                buffer <= {in[7:0],buffer[15:0]};
            end
            else if(state == R1)begin
                state <= R2;
                buffer <= {buffer[23:16],in[7:0],buffer[7:0]};
            end
            else if(state == R2) begin
                state <= R3;
                buffer <= {buffer[23:8],in[7:0]};
            end
            else if(state == R3 && in[3] == 0)begin
                state <= R0;
                buffer <= 24'b0;
            end
            else if(state == R3 && in[3] == 1)begin
                state <= R1;
                buffer <= {in[7:0],buffer[15:0]};
            end
        end
    end
    // State flip-flops (sequential)
    // always @(*) begin
    //     next_state = state;
    //     case(state)
    //         R0:
    //             if(in[3] == 1)
    //                 next_state = R1;
    //             else
    //                 next_state = R0;
    //         R3:
    //             if(in[3] == 1)
    //                 next_state = R1;
    //             else
    //                 next_state = R0;
    //     endcase
    // end

    // Output logic
    assign done = (state == R3) ? 1 : 0;
    assign out_bytes = buffer;
endmodule
