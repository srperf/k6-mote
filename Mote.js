import http from 'k6/http';
import exec from 'k6/execution';
import { sleep } from 'k6';
  
export default function () {
    const motePeriod = 30000;
    /*Step1*/http.get('https://test-api.k6.io/public/crocodiles/1/');
    sleep(Math.random() * 3);
    /*Step2*/http.get('https://test-api.k6.io/public/crocodiles/2/');
    sleep(Math.random() * 3);
    /*Step3*/http.get('https://test-api.k6.io/public/crocodiles/3/');
    sleep(Math.random() * 3);
    /*Step4*/http.get('https://test-api.k6.io/public/crocodiles/4/');

    mote(motePeriod);
    
    /*Step5*/http.get('https://test-api.k6.io/public/crocodiles/');
    sleep(Math.random() * 3);
    /*Step6*/http.get('https://test-api.k6.io/public/crocodiles/5/');
    sleep(Math.random() * 3);
    /*Step7*/http.get('https://test-api.k6.io/public/crocodiles/6/');
    sleep(Math.random() * 3);
    /*Step8*/http.get('https://test-api.k6.io/public/crocodiles/1/');
    sleep(Math.random() * 3);
}

function mote(motePeriod) {
    var soFar = new Date().getTime() - exec.scenario.startTime;
    var waitTime = (motePeriod-(soFar%motePeriod))/1000;
    sleep(waitTime);
}