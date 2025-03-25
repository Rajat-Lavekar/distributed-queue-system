package main

import (
    "github.com/gin-gonic/gin"
    "github.com/google/uuid"
    "net/http"
    "sync"
    "time"
)

type Task struct {
    ID        string    `json:"id"`
    Name      string    `json:"name"`
    Stream    string    `json:"taskStream"`
    Status    string    `json:"status"`
    Timestamp time.Time `json:"timestamp"`
}

var (
    tasks     []Task
    taskQueue = make(chan Task, 100)
    mu        sync.Mutex
    schedulingMechanism string
)

func main() {
    r := gin.Default()

    r.GET("/api/tasks", getTasks)
    r.POST("/api/tasks", submitTask)
    r.GET("/api/workers", getWorkers)
    r.POST("/api/workers", addWorker)

    go processTasks()

    r.Run(":8080")
}

func getTasks(c *gin.Context) {
    mu.Lock()
    defer mu.Unlock()
    c.JSON(http.StatusOK, gin.H{
        "pending":    countTasksByStatus("pending"),
        "inProgress": countTasksByStatus("inProgress"),
        "completed":  countTasksByStatus("completed"),
        "failed":     countTasksByStatus("failed"),
        "tasks":      tasks,
    })
}

func submitTask(c *gin.Context) {
    var newTask Task

    if err := c.ShouldBindJSON(&newTask); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }

    schedulingMechanism = c.Query("schedulingMechanism")

    mu.Lock()
    defer mu.Unlock()

    newTask.ID = uuid.NewString()
    newTask.Status = "pending"
    newTask.Timestamp = time.Now()
    tasks = append(tasks, newTask)

    // Added task to the queue
    taskQueue <- newTask

    c.JSON(http.StatusOK, newTask)
}

func getWorkers(c *gin.Context) {
    //TODO: Implement worker status retrieval
}

func addWorker(c *gin.Context) {
    //TODO: Implement worker addition
}

func countTasksByStatus(status string) int {
    count := 0
    for _, task := range tasks {
        if task.Status == status {
            count++
        }
    }
    return count
}

func processTasks() {
    lruCache := NewLRUCache(10) // LRU cache with a capacity of 10 tasks
    roundRobinQueue := make([]Task, 0)
    fifoQueue := make([]Task, 0)

    for task := range taskQueue {
        switch schedulingMechanism {
        case "LRU":
            lruCache.Put(task.ID, task)
            processTaskStream(task)
        case "RoundRobin":
            roundRobinQueue = append(roundRobinQueue, task)
            processRoundRobin(roundRobinQueue)
        case "FIFO":
            fifoQueue = append(fifoQueue, task)
            processFIFO(fifoQueue)
        default:
            // Default to FIFO if no mechanism is specified
            fifoQueue = append(fifoQueue, task)
            processFIFO(fifoQueue)
        }
    }
}

func processTaskStream(task Task) {
    //TODO: Implement the logic to process the task stream (CPU and IO operations)
}

func processRoundRobin(queue []Task) {
    //TODO: Implement Round Robin scheduling logic
}

func processFIFO(queue []Task) {
    //TODO: Implement FIFO scheduling logic
}

type LRUCache struct {
    capacity int
    cache    map[string]*Task
    order    []string
    mu       sync.Mutex
}

func NewLRUCache(capacity int) *LRUCache {
    return &LRUCache{
        capacity: capacity,
        cache:    make(map[string]*Task),
        order:    make([]string, 0, capacity),
    }
}

func (l *LRUCache) Put(key string, value Task) {
    l.mu.Lock()
    defer l.mu.Unlock()

    if _, exists := l.cache[key]; exists {
        l.remove(key)
    } else if len(l.order) >= l.capacity {
        oldest := l.order[0]
        l.remove(oldest)
    }

    l.cache[key] = &value
    l.order = append(l.order, key)
}

func (l *LRUCache) Get(key string) (*Task, bool) {
    l.mu.Lock()
    defer l.mu.Unlock()

    if value, exists := l.cache[key]; exists {
        l.remove(key)
        l.cache[key] = value
        l.order = append(l.order, key)
        return value, true
    }

    return nil, false
}

func (l *LRUCache) remove(key string) {
    delete(l.cache, key)
    for i, k := range l.order {
        if k == key {
            l.order = append(l.order[:i], l.order[i+1:]...)
            break
        }
    }
}