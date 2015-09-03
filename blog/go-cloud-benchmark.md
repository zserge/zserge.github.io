title: Benchmarking Go in the cloud
description: Compare performance of a simple Go web app running on Heroku, OpenShift, Digital Ocean and AWS
date: 2015-09-04
---

# Benchmarking Go in the cloud

[Go] now seems to be a natural choice for writing your next microservice or web
app. It's mature and fast.

But where would you host your app? In this post I will compare some popular
PaaS (platform-as-a-service) and how the same primitive Go web app performs on
each of them.

## Go

I'm using the latest Go compiler and the latest version of [Gin] framework
with zero-allocation router.

Gin is configured to run in release mode, but I used default gin settings,
where a single-line log per request is printed, because that's what most web
apps would like to have anyway.

App has one route "/ping" and responds with a static string "pong" (as in Gin's
example).

Benchmarks are made using [wrk] utility. I used 2 threads (my laptop is not
that powerful to run more) and 100 connections.

main.go:

``` go
package main

import (
        "os"

        "github.com/gin-gonic/gin"
)

func main() {
        addr := ":8080"
        if env := os.Getenv("PORT"); env != "" {
                addr = ":" + env
        }
        if env := os.Getenv("OPENSHIFT_GO_PORT"); env != "" {
                addr = os.Getenv("OPENSHIFT_GO_IP") + ":" + env
        }
        gin.SetMode(gin.ReleaseMode)
        r := gin.Default()
        r.GET("/ping", func(c *gin.Context) {
                c.String(200, "pong")
        })
        r.Run(addr)
}
```

Procfile:
```
web: go-cloud-benchmark
```

Godeps generated automatically with `godep save`.

## My laptop

Old dual-core Thinkpad X120e running Ubuntu 14.04 LTS. Since I've been running
other apps during this test - the result is just a rough approximation of how
my dev machine performs.

In the logs Gin reports that each request takes it 7..30 microseconds to
process. Here's what wrk says:

```
Running 30s test @ http://localhost:8080/ping
	2 threads and 100 connections
	Thread Stats   Avg      Stdev     Max   +/- Stdev
		Latency    68.48ms  104.17ms   1.56s    93.11%
		Req/Sec     1.05k   406.19     3.47k    75.26%
	62189 requests in 30.08s, 7.12MB read
Requests/sec:   2067.63
Transfer/sec:    242.30KB
```

## Heroku

[Heroku] is a well-known cloud platform, only one app can be hosted for free.
Integration with Github is super-easy and deployment procedure is just a single button click (which can be automated as well).

```
Running 30s test @ http://bench.herokuapp.com/ping
	2 threads and 100 connections
	Thread Stats   Avg      Stdev     Max   +/- Stdev
		Latency    90.30ms   41.55ms 643.77ms   88.68%
		Req/Sec   569.23    186.85     0.89k    76.95%
	33778 requests in 30.08s, 5.67MB read
Requests/sec:   1122.88
Transfer/sec:    192.95KB
```

## OpenShift

[OpenShift] is a cloud platform made by [RedHat]. It allows you to run up to 3
apps for free. As with Heroku, you can just enter a link to your github sources
and the git branch name, and the deployment will happen automatically.

There is a ready-to-use Go cartridge (aka gear aka dyno), but beware that your
app port is not in the `$PORT` env variable, but in `$OPENSHIFT_GO_PORT`. Also,
you should care about `$OPENSHIFT_GO_IP` variable, it tells where to bind you
listening socket to.

At the moment OpenShift Go cartridge still uses Go 1.4, so this might affect
the performance due to GC improvements they made in Go 1.5.

```
Running 30s test @ http://bench-tunes.rhcloud.com/ping
  2 threads and 100 connections
 Thread Stats   Avg      Stdev     Max   +/- Stdev
   Latency   171.70ms   87.78ms   1.96s    92.20%
   Req/Sec   305.20    114.46   505.00     65.20%
  17990 requests in 30.08s, 2.46MB read
Requests/sec:    597.99
Transfer/sec:     83.57KB
```

Yes, I ran the test several times, and the numbers were never higher than 650
requests per second (which happened once).

Cool feature of OpenShift is automatic scaling. I only had 2 gears available
for scaling, and here's the results with the load balancer they provide:

```
Running 30s test @ http://bench-tunes.rhcloud.com/ping
  2 threads and 100 connections
  Thread Stats   Avg      Stdev     Max   +/- Stdev
    Latency   364.71ms  240.09ms   1.91s    93.57%
    Req/Sec    80.35     49.57   262.00     62.11%
  4547 requests in 30.07s, 1.25MB read
  Socket errors: connect 0, read 0, write 0, timeout 23
  Non-2xx or 3xx responses: 4547
Requests/sec:    151.22
Transfer/sec:     42.63KB
```

Wait... I wish someone could explain this to me - how scaling onto another gear
makes the app 3 times slower? Tried the test multiple times, results are pretty
much the same.

## DigitalOcean + Dokku

[Digital Ocean] is a well-known hosting provider. Although you can not get a
free VM, you can buy the cheapest one for 5$ per month and install [Dokku]
there.

[Dokku] is a DIY Heroku alternative. It uses [Docker] and [Heroku buildpacks]
to create app containers.

So I only added a remote git branch pointing to my existing 5$ DigitalOcean VM
and made a git push. A few seconds later my app was up and running.

```
Running 30s test @ http://dokku.trikita.co:32777/ping
  2 threads and 100 connections
	Thread Stats   Avg      Stdev     Max   +/- Stdev
		Latency   137.23ms   24.27ms 817.04ms   97.53%
		Req/Sec   367.39     54.15   480.00     71.14%
	21855 requests in 30.05s, 2.50MB read
Requests/sec:    727.20
Transfer/sec:     85.22KB
```

## AWS EC2 + Dokku

Amazon provides its own [Elastic BeanStalk] with Docker, but my general
impression was rather negative because the deployment procedure was way too
slow.

Still, you can always install Dokku onto your regular AWS [EC2] instance. I
used the existing `t2.micro` instance.

```
Running 30s test @ http://52.25.xx.xx:32769/ping
  2 threads and 100 connections
	Thread Stats   Avg      Stdev     Max   +/- Stdev
		Latency   216.62ms   28.15ms   1.08s    97.41%
		Req/Sec   232.62     55.81   480.00     75.04%
	13724 requests in 30.08s, 1.57MB read
Requests/sec:    456.20
Transfer/sec:     53.46KB
```

Yep, even slower than OpenShift. Tried multiple times.

## Summary

Just summing up:

```
localhost:           2067 / free :)
Heroku:              1122 / 1 free dyno
DigitalOcean/Dokku:   727 / 5$ per month (0.007$/hour), multiple containers
OpenShift:            597 / 3 free cartridges
AWS T2.micro/Dokku:   456 / 0.013$/hour, multiple containers
```

Altough my persontal preference is Digital Ocean, I like how well Heroku
performs. If only they gave more than one dyno for free - it would be a great
choice for development purposes.

I'm very surprised with the OpenShift balancer, I really was hoping it gives
some dramatic improvements to performance.

Finally, I didn't expect Amazon to take the last place in this rating. It might
be good for big apps, but for small experiments, well, they charge more than
DigitalOcean does, yet they have about 40% worse performance.

P.S. I understand that this benchmark can show different numbers in your case.
But if you have any comments or different results - [let me know]!

[Go]: http://golang.org/
[Gin]: https://github.com/gin-gonic/gin
[wrk]: https://github.com/wg/wrk
[Heroku]: https://heroku.com
[OpenShift]: https://www.openshift.com/
[RedHat]: http://www.redhat.com/en
[Digital Ocean]: http://digitalocean.com
[Dokku]: https://progrium.viewdocs.io/dokku/
[Docker]: https://www.docker.com
[Heroku buildpacks]: https://github.com/gliderlabs/herokuish/tree/master/buildpacks
[Elastic BeanStalk]: http://docs.aws.amazon.com/elasticbeanstalk/latest/dg/Welcome.html
[EC2]: https://aws.amazon.com/ec2/
[let me know]: https://twitter.com/zsergo
