import http from 'k6/http';
import exec from 'k6/execution';
import { sleep } from 'k6';

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

function mote(motePeriod) {
    var start = exec.scenario.startTime;
    var soFar = new Date().getTime() - start;
    var waitTime = (motePeriod-(soFar%motePeriod))/1000;
    sleep(waitTime);
}

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