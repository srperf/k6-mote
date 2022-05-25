# Rendezvous and k6
Rendezvous is a french word commonly used in the load testing word. It sounds so fancy!

I believe Mercury first coined and implemented it (I may be wrong) in LoadRunner. Neo Load has it with the same name, and JMeter calls it Synchronizing timer.

But what is it really, and how may we use it? 

Thanks to the contribution of [Mark Tomlinson](https://www.linkedin.com/in/mtomlins/), I have a perfect analogy to explain it. Let's go over it.

## Rendezvous in action

Rendezvous is a function that allows the virtual users in a scenario to run the steps of a script, everyone at their own pace or arrival rate. But once everyone reaches a specific step, the function makes them wait some time or for more people to get to that step and then execute it simultaneously.

To explain it better, let's use Mark's example.
![SkiPark](../images/skiPark.png)
Imagine you are at a ski resort or park. In those places, the people would follow these steps:

1.  Get to the park
2.  Buy their passes
3.  Rent equipment
4.  Gear up
5.  Head to the lift
6.  **Wait for the lift**
7.  Get on the lift
8.  Be lifted
9.  Ski through different lanes
10.  Repeat step 5 until tired
11.  Take off the gear
12.  Return the gear
13.  Go home

Step 6 is our point of interest, as it is an excellent rendezvous example.
![SkiLift](../images/skiLift1.png)
In a ski park, you have multiple people, each doing their set of steps at their own pace. Some arrived earlier, some just arrived. Once at the park, each person may do things at different speeds. Some may take longer to gear up; for others, the rental area may be slow at rush hours, and some may even pause to go to the bathroom. Once up there, some may ski fast, while others may be slow, depending on if they are beginners or experts.

That sounds a lot like a load test scenario.

Each virtual user executes the steps, iterates, ramps up or down, and has a somewhat different response and wait times on each action. A beautiful load scenario!

But unlike standard scripts where everyone executes at their pace, we have step 6 (wait for the lift), where the users wait as they arrive, and all of them do step 7 (jump on the lift) simultaneously when there are enough people to fill the lift, or the lift has to leave as the next one is coming.
![Rendezvous](../images/skiLiftQueue.png)
That is rendezvous in essence. It is a process that holds every user arriving at that step (the lift departing) until enough people are waiting, or it has to leave with whoever is waiting there when the next lift comes. In other words, you define time to wait and people per lift.

The rendezvous lift is different from real life, where you have to wait for the next lift once the first one is full. Here, the lift leaves right after it reaches its capacity. There are more ready to get people right away. But, if the time is up and the following lift arrives, it will depart even if there is only one person inside.
![EmptyLift](../images/skiLiftEmpty.png)
Example: 
	```
	rendezvous(numberOfVUsers, timeToWait);
	```

## How to, in k6

Out of the function's two parameters, a number parameter for users, or the timelapse, I think time is the easiest to implement in k6.

To follow the Swedish heritage of k6, instead of rendezvous, I would like to call it: **möte**.

Following the ski lift example, the most straightforward approach is for our möte function to work like the ski lift, which automatically passes and picks people.

First, we define how many milliseconds the timelapse should be.

``` 
motePeriod = 30000; //In milliseconds
```

  

Now here is my proposed first and easy mote function.

```
function mote(motePeriod) {
    var start = exec.scenario.startTime;
    var soFar = new Date().getTime() - start;
    var waitTime = (motePeriod-(soFar%motePeriod))/1000;
    sleep(waitTime);
}
```

That function will take the start time of the scenario and restart the mote (meeting) timer every time it is completed.

With that function, our example script could go like this:

```
import http from 'k6/http';
import exec from 'k6/execution';
import { sleep } from 'k6';

export default function () {
    const motePeriod = 30000;
    
    /*Step1*/http.get('https://test-api.k6.io/public/crocodiles/1/');
    sleep(Math.random() * 5);

    /*Step2*/http.get('https://test-api.k6.io/public/crocodiles/2/');
    sleep(Math.random() * 5);
    
    /*Step3*/http.get('https://test-api.k6.io/public/crocodiles/3/');
    sleep(Math.random() * 5);
    
    /*Step4*/http.get('https://test-api.k6.io/public/crocodiles/4/');
  
    mote(motePeriod);

    /*Step5*/http.get('https://test-api.k6.io/public/crocodiles/');
    sleep(Math.random() * 5);
    
    /*Step6*/http.get('https://test-api.k6.io/public/crocodiles/5/');
    sleep(Math.random() * 5);
    
    /*Step7*/http.get('https://test-api.k6.io/public/crocodiles/6/');
    sleep(Math.random() * 5);
    
    /*Step8*/http.get('https://test-api.k6.io/public/crocodiles/1/');
    sleep(Math.random() * 5);
}
```

With the code above, the virtual users will execute their steps and wait for the mote period to happen before executing step 5. Like in the lift example, the ski lift will leave every 30 seconds with whatever users have arrived at the mote wait. Yes, this one is a lift with infinite capacity.
![HugeLift](../images/skiLift2.png)

Let's do a small scenario with arrivals and multiple users to sow this.

```
export const options = {
    scenarios: {
        TheMote: {
            executor: 'ramping-vus',
            startVUs: 0,
            stages: [
                { duration: '40s', target: 20 },
                { duration: '2m', target: 20 },
              { duration: '5s', target: 0 },
            ],
            gracefulRampDown: '0s',
        },
  },
};
```

We will have 20 users gradually arriving at the ski park (the scenario) for 40 seconds (one every 2 seconds). After that, they will continue skiing for 2 minutes.

The mote timer is set to 30000 milliseconds. In other words, the first lift will leave 30 seconds after the test starts and repeat in the same interval.

In this example, the first ski lift will leave before everyone arrives at the park. Only about 15 users will have arrived when the first lift departs. So only 15 will get on the lift and execute step 5. Then, the last 5 users will gradually enter the scenario. They will wait for the next lift at step 4 and will be joined by whoever of the other 15 who complete the trip before the next 30 seconds.

Running that scenario, we will observe the following results:
![MoteGraph](../images/moteExplain.png)
As you can see, every 30 seconds, there is a spike in the number of requests. This means that everyone waited for the lift and executed step 5 every time the 30-second lapse was completed.

## Start upon arrival

Other options can be worked out in this functionality, such as starting the mote timer when the first user arrives, instead of when the test begins.

Quickly implementing it, we could initialize a global flag (moteClean) as _true_. Once inside the mote function, set the mote start time with the current time and mark the flag as _false_ if the flag was true. With this, the first user will initialize it, and it'll be ready for the rest of the run!

```
function moteOnArrive(motePeriod) {

    var start;

    if (moteClean)

    {

        start=new Date().getTime();

        moteFlag=false;

    }

    var soFar = new Date().getTime() - start;

    var waitTime = (motePeriod-(soFar%motePeriod))/1000;

    sleep(waitTime);

}
```

## Other cases

The functionality of waiting based on the number of virtual users is a bit more complicated. Not to mention the other functionality with both timer and user counts altogether.

This exercise gives a couple of quick samples for a straightforward implementation. But these functionalities are continuous work in progress that can be improved by the community as the need arises.

What do you think? Should this functionality be fully implemented? Would you like to contribute? You may have a straightforward idea of how to easily do the other cases!

I have uploaded the above examples to a repository for everyone to take a look at, use, or collaborate on. 
Check it out here: https://github.com/srperf/k6-mote

For now, I will leave it here, hoping that this helped to quickly implement this mote (rendezvous) functionality.

Happy performance tests and besos!
-- Leandro