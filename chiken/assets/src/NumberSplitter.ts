import { _decorator, Component, Node, Label, Prefab, instantiate } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('NumberSplitter')
export class NumberSplitter extends Component {
    // Префабы для уведомлений
    @property({ type: Prefab }) dummyPrefab: Prefab | null = null;
    @property({ type: Prefab }) dummyLabelPrefab: Prefab | null = null;
    @property({ type: Prefab }) prefab1: Prefab | null = null;
    @property({ type: Prefab }) labelPrefab1: Prefab | null = null;
    @property({ type: Prefab }) prefab2: Prefab | null = null;
    @property({ type: Prefab }) labelPrefab2: Prefab | null = null;
    @property({ type: Prefab }) prefab3: Prefab | null = null;
    @property({ type: Prefab }) labelPrefab3: Prefab | null = null;

    // Настройки
    @property({ type: Node }) parentNode: Node | null = null;
    @property({ type: Component }) audioIntervalPlayer: Component | null = null;
    @property addEuroSuffix: boolean = true;
    @property maxSum: number = 3000;
    @property spawnInterval: number = 0.2;

    private spawnedNodes: Node[] = [];
    private numbersQueue: number[] = [];
    private isSpawning: boolean = false;
    private dummyNode: Node | null = null;

    onLoad() {
        // Clear any existing spawned nodes
        this.clearSpawnedNodes();
        // Pre-spawn dummy notification
        this.spawnDummyNotification();
        console.log(`NumberSplitter on ${this.node.name}: Initialized with dummy prefab pre-spawned`);
    }

    public setNumbers(value: number): void {
        // Clear numbersQueue to prevent accumulation of old values
        this.numbersQueue = [];
        const sums = this.splitNumber(value);
        this.numbersQueue.push(...sums);
        console.log(`NumberSplitter on ${this.node.name}: Set value=${value}, numbersQueue=[${this.numbersQueue.join(', ')}]`);
    }

    public startSpawning(): void {
        if (this.isSpawning || !this.parentNode) return;

        this.isSpawning = true;
        this.setupAudio(this.numbersQueue.length);

        // Clear all nodes except the pre-spawned dummy
        this.clearSpawnedNodes(false);
        // Reset spawnedNodes
        this.spawnedNodes = [];
        // Add dummyNode at highest sibling index (top)
        if (this.dummyNode && this.dummyNode.isValid) {
            this.dummyNode.active = false;
            this.dummyNode.setSiblingIndex(this.numbersQueue.length);
            this.spawnedNodes.push(this.dummyNode);
            console.log(`NumberSplitter on ${this.node.name}: Initialized dummyNode at SiblingIndex=${this.numbersQueue.length}`);
        }

        // Start spawning sum prefabs
        this.spawnNextNotification(0);
    }

    private spawnNextNotification(index: number): void {
        if (index >= this.numbersQueue.length || index >= 3) {
            // Activate dummyNode to ensure it appears
            if (this.dummyNode && this.dummyNode.isValid) {
                this.dummyNode.active = true;
                console.log(`NumberSplitter on ${this.node.name}: Activated dummyNode at SiblingIndex=${this.dummyNode.getSiblingIndex()}`);
            }
            this.isSpawning = false;
            this.numbersQueue = []; // Clear queue
            return;
        }

        const prefabs = [this.prefab1, this.prefab2, this.prefab3];
        const labelPrefabs = [this.labelPrefab1, this.labelPrefab2, this.labelPrefab3];
        const prefabIndex = index;

        if (!prefabs[prefabIndex] || !labelPrefabs[prefabIndex]) {
            console.warn(`NumberSplitter on ${this.node.name}: Missing prefab or labelPrefab at index ${prefabIndex}, skipping`);
            this.scheduleOnce(() => this.spawnNextNotification(index + 1), this.spawnInterval);
            return;
        }

        const node = this.createNotification(
            prefabs[prefabIndex]!,
            labelPrefabs[prefabIndex]!,
            this.numbersQueue[index],
            this.numbersQueue.length - 1 - index // Decreasing indices: 3000s first, then remainder
        );
        
        // Add sum prefab to spawnedNodes
        this.spawnedNodes.push(node);
        console.log(`NumberSplitter on ${this.node.name}: Added prefab${index + 1} to spawnedNodes, SiblingIndex=${node.getSiblingIndex()}`);

        this.scheduleOnce(() => {
            this.spawnNextNotification(index + 1);
        }, this.spawnInterval);
    }

    private spawnDummyNotification(): void {
        if (!this.dummyPrefab || !this.dummyLabelPrefab || !this.parentNode) {
            console.warn(`NumberSplitter on ${this.node.name}: Cannot spawn dummy, missing components`);
            return;
        }
        
        this.dummyNode = instantiate(this.dummyPrefab);
        const dummyLabelNode = instantiate(this.dummyLabelPrefab);
        const dummyLabel = dummyLabelNode.getComponent(Label);
        if (!dummyLabel) {
            console.warn(`NumberSplitter on ${this.node.name}: Dummy label prefab has no Label component`);
            this.dummyNode.destroy();
            this.dummyNode = null;
            return;
        }
        
        dummyLabelNode.active = true;
        dummyLabelNode.parent = this.dummyNode;
        this.dummyNode.active = false; // Initially disabled
        this.dummyNode.parent = this.parentNode;
        this.dummyNode.setSiblingIndex(0); // Initial position, updated in startSpawning
        console.log(`NumberSplitter on ${this.node.name}: Pre-spawned dummy prefab (Node=${this.dummyNode.name}, Label=${dummyLabel.string}, SiblingIndex=${this.dummyNode.getSiblingIndex()}, Active=${this.dummyNode.active})`);
    }

    private createNotification(
        prefab: Prefab,
        labelPrefab: Prefab,
        value: number,
        index: number
    ): Node {
        const newNode = instantiate(prefab);
        newNode.active = true;
        newNode.parent = this.parentNode;
        newNode.setSiblingIndex(index);

        const labelNode = instantiate(labelPrefab);
        const label = labelNode.getComponent(Label);
        if (label) {
            label.string = `+${this.formatNumber(value)}`;
            labelNode.parent = newNode;
        }

        console.log(`NumberSplitter on ${this.node.name}: Spawned prefab${index + 1} (Node=${newNode.name}, Label=${label?.string}, SiblingIndex=${newNode.getSiblingIndex()}, Active=${newNode.active})`);
        return newNode;
    }

    private setupAudio(count: number): void {
        if (this.audioIntervalPlayer && 
            typeof (this.audioIntervalPlayer as any).maxPlayCount !== 'undefined') {
            (this.audioIntervalPlayer as any).maxPlayCount = count-1; // +1 for dummy
            console.log(`NumberSplitter on ${this.node.name}: Set AudioIntervalPlayer.maxPlayCount=${count + 1}`);
        } else {
            console.warn(`NumberSplitter on ${this.node.name}: AudioIntervalPlayer not assigned or maxPlayCount undefined`);
        }
    }

    private clearSpawnedNodes(clearDummy: boolean = true): void {
        this.spawnedNodes.forEach(node => {
            if (node && node.isValid && (clearDummy || node !== this.dummyNode)) {
                node.destroy();
                console.log(`NumberSplitter on ${this.node.name}: Destroyed node ${node.name}`);
            }
        });
        this.spawnedNodes = clearDummy ? [] : [this.dummyNode!].filter((node) => node && node.isValid);
        console.log(`NumberSplitter on ${this.node.name}: Cleared spawned nodes, retaining dummy=${!clearDummy}`);
    }

    private splitNumber(value: number): number[] {
        const sums: number[] = [];
        let remaining = Math.max(0, value);

        if (remaining <= this.maxSum) {
            sums.push(remaining);
        } else {
            while (remaining > 0 && sums.length < 3) {
                if (remaining > this.maxSum) {
                    sums.push(this.maxSum);
                    remaining -= this.maxSum;
                } else {
                    sums.push(remaining);
                    remaining = 0;
                }
            }
        }

        console.log(`NumberSplitter on ${this.node.name}: splitNumber(value=${value}) returns [${sums.join(', ')}]`);
        return sums;
    }

    private formatNumber(value: number): string {
        const formatted = value.toFixed(2);
        return this.addEuroSuffix ? `${formatted} €` : formatted;
    }
}