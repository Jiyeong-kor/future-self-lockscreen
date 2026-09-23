import unittest
from select_ios_simulator import select_device


class SimulatorSelectionTests(unittest.TestCase):
    def fixture(self):
        return {
            "runtimes": [
                {"identifier": "com.apple.CoreSimulator.SimRuntime.iOS-18-5", "version": "18.5", "isAvailable": True},
                {"identifier": "com.apple.CoreSimulator.SimRuntime.iOS-26-0", "version": "26.0", "isAvailable": True},
            ],
            "devices": {
                "com.apple.CoreSimulator.SimRuntime.iOS-18-5": [{"name": "iPhone 16", "isAvailable": True,
                    "deviceTypeIdentifier": "com.apple.CoreSimulator.SimDeviceType.iPhone-16"}],
                "com.apple.CoreSimulator.SimRuntime.iOS-26-0": [{"name": "iPhone 17", "isAvailable": True,
                    "deviceTypeIdentifier": "com.apple.CoreSimulator.SimDeviceType.iPhone-17"}],
            },
        }

    def test_latest_available_runtime(self):
        self.assertEqual(select_device(self.fixture())[1], "com.apple.CoreSimulator.SimRuntime.iOS-26-0")

    def test_unavailable_runtime_is_not_selected(self):
        data = self.fixture()
        data["runtimes"][1]["isAvailable"] = False
        self.assertTrue(select_device(data)[1].endswith("18-5"))

    def test_device_type_fallback(self):
        data = self.fixture()
        del data["devices"]["com.apple.CoreSimulator.SimRuntime.iOS-26-0"][0]["deviceTypeIdentifier"]
        data["devicetypes"] = [{"name": "iPhone 17", "identifier": "com.apple.CoreSimulator.SimDeviceType.iPhone-17"}]
        self.assertTrue(select_device(data)[0].endswith("iPhone-17"))

    def test_empty_devices_fail(self):
        with self.assertRaises(ValueError):
            select_device({})

    def test_non_phone_is_not_selected(self):
        data = self.fixture()
        data["devices"]["com.apple.CoreSimulator.SimRuntime.iOS-26-0"][0]["name"] = "iPad"
        self.assertTrue(select_device(data)[1].endswith("18-5"))


if __name__ == "__main__":
    unittest.main()
