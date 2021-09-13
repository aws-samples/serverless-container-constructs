FROM public.ecr.aws/lambda/provided:al2 AS builder

RUN yum update -y && yum install -y golang

WORKDIR /go/src/myapp.github.com

COPY . .

RUN GOOS=linux GOARCH=amd64 go build

FROM public.ecr.aws/lambda/provided:al2

WORKDIR /root/

COPY --from=builder /go/src/myapp.github.com/myapp /root/

RUN ls /root/

EXPOSE 8080

ENTRYPOINT []

CMD ["./myapp"]