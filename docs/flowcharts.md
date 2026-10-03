# ARCH-LAB Flowcharts

These diagrams describe the current application after removing the CPU Simulator and Performance Analysis pages. Simulation runs in the browser; the optional backend provides the shared program library. The shared CPU engine still powers instruction execution, registers, memory, and the Home overview.

## System flowchart

```mermaid
flowchart TD
    A([Open application]) --> B[Initialize sample program, registers, memory, and cache]
    B --> C[Render selected page]
    C --> D{User action}

    D -->|Load program| E[Parse assembly and initialize machine state]
    E --> F{Valid syntax and operands?}
    F -->|No| G[Display error and block execution]
    F -->|Yes| C
    G --> C

    D -->|Step or Auto Run tick| H{Execution allowed?}
    H -->|Error or halted| C
    H -->|Yes| I[Save previous machine state]
    I --> J{Current phase}
    J -->|Fetch| K[Read instruction at PC; update MAR, MDR, IR, and PC]
    J -->|Decode| L[Identify operation and operands]
    J -->|Execute| M{LOAD or STORE?}
    K --> N[Update phase, cycle count, and status]
    L --> N
    M -->|No| O[Execute ALU, MOV, NOP, or HALT]
    M -->|Yes| P[Map data address to cache set and tag]
    P --> Q{Cache hit?}
    Q -->|Yes| R[Access cached byte]
    Q -->|No| S[Fill block from memory; replace a line if needed]
    R --> T[LOAD updates register; STORE updates cache and main memory]
    S --> T
    T --> U[Update cache counters and apply hit or miss cycle cost]
    O --> V[Update registers, flags when applicable, and execution log]
    U --> V
    V --> N
    N --> C

    D -->|Pause| W[Stop automatic instruction stepping]
    D -->|Step Back| X[Restore previous machine state when history exists]
    D -->|Reset| Y[Reinitialize loaded program and clear machine history]
    W --> C
    X --> C
    Y --> C

    D -->|Standalone ALU input or Execute| Z[Compute result and flags in page-local state]
    Z --> C
    D -->|Manual cache access or Auto Step| CA[Read shared memory through cache; update cache history and counters]
    CA --> C
    D -->|Cache configuration or reset| CB[Rebuild cache and clear affected histories]
    CB --> C
    D -->|Cache Step Back| CC[Restore previous cache state when history exists]
    CC --> C

    D -->|Program library request| API[Call Express REST API]
    API --> DB[(MySQL shared programs)]
    DB --> RESULT{Request successful?}
    RESULT -->|Yes| LIB[Refresh library or load selected source]
    RESULT -->|No| ERR[Display library error]
    LIB --> C
    ERR --> C
```

Each instruction step advances one phase. Fetching beyond the last instruction or executing HALT ends execution. Auto Run repeats steps until paused or completed. ALU Step reveals bits of the computed result; it does not advance the shared machine. Cache manual accesses share the machine's cache but do not execute instructions. Loading a saved program uses source already retrieved in the library list; it then follows the same parsing path as a locally entered program.

## User flowchart

```mermaid
flowchart TD
    A([Open ARCH-LAB]) --> B[View Home and the sample program overview]
    B --> C{Choose a page from the sidebar}

    C -->|Home| HOME[Inspect architecture and use Step, Auto Run, Pause, or Step Back]
    C -->|Instruction Execution| D[Use current program, edit source, or load sample]
    D --> E[Click Load Program after editing]
    E --> F{Program accepted?}
    F -->|No| G[Read error and correct source]
    G --> D
    F -->|Yes| H[Step Forward or Auto Run]
    D -->|Use already loaded program| H
    H --> I[Inspect current instruction, flags, and execution history]
    I --> J{Next action}
    J -->|Continue| H
    J -->|Pause or Step Back| K[Pause execution or inspect a previous state]
    K --> I
    J -->|Reset or change source| D
    J -->|Finish| C

    D -->|Optional shared library in Edit view| LIB[Save source, select saved program, or delete saved program]
    LIB --> OK{Backend request succeeds?}
    OK -->|No| ERROR[Read library error; local simulation remains available]
    ERROR --> D
    OK -->|Selected program loaded| F
    OK -->|Saved or deleted| D

    C -->|ALU Simulator| ALU[Enter operands and select operation]
    ALU --> AR[Inspect result and flags; Execute records recent operation; Step reveals bits]
    AR -->|Try another operation or Reset| ALU
    AR -->|Return to navigation| C

    C -->|Cache Simulator| CACHE[Choose mapping, cache size, and block size]
    CACHE --> ADDR[Enter hexadecimal address; Access Address or Auto Step]
    ADDR --> CR[Inspect hit or miss, cache lines, and hit ratio]
    CR -->|Another access| ADDR
    CR -->|Reconfigure or Reset Stats| CACHE
    CR -->|Step Back| BACK[Inspect previous cache state]
    BACK --> CR
    CR -->|Return to navigation| C

    C -->|Registers| REG[Inspect register values; Step, Auto Step, Pause, or Step Back]
    C -->|Memory| MEM[Browse bytes, jump to address, or go to MAR; use execution controls]
    C -->|Documentation or About| INFO[Read instructions or project information]
    HOME --> C
    REG --> C
    MEM --> C
    INFO --> C
    C -->|Close application| END([End session])
```

There is no login. Programs saved through the backend belong to a shared public library. Home, Registers, Memory, and Instruction Execution view the same machine state; changing pages preserves it. The standalone ALU's inputs and recent operations are local to its page.
