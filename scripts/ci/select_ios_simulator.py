"""simctl 결과에서 현재 설치된 iOS 런타임과 호환 iPhone 기종을 선택한다."""
import json
import re
import sys


def select_device(data):
    runtimes = [runtime for runtime in data.get("runtimes", [])
                if runtime.get("isAvailable") is True
                and ".iOS-" in runtime.get("identifier", "")]
    runtimes.sort(key=lambda runtime: tuple(int(x) for x in
                  re.findall(r"\d+", runtime.get("version", "0"))), reverse=True)
    for runtime in runtimes:
        for device in data.get("devices", {}).get(runtime["identifier"], []):
            if not device.get("isAvailable") or not device.get("name", "").startswith("iPhone"):
                continue
            device_type = device.get("deviceTypeIdentifier")
            if device_type is None:
                device_type = next((item["identifier"] for item in data.get("devicetypes", [])
                                    if item.get("name") == device["name"]), None)
            if isinstance(device_type, str) and device_type.startswith("com.apple.CoreSimulator.SimDeviceType.iPhone-"):
                return device_type, runtime["identifier"]
    raise ValueError("사용 가능한 iOS 런타임과 iPhone 기종을 찾지 못했습니다.")


if __name__ == "__main__":
    try:
        print(" ".join(select_device(json.load(sys.stdin))))
    except (ValueError, KeyError, TypeError) as error:
        print(str(error), file=sys.stderr)
        sys.exit(1)
