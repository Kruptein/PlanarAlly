from typing import Any


def assert_all_results_same_data(
    results: list[tuple[str, Any]],
):
    event = results[0][0]
    data = results[0][1]
    for result in results:
        assert result[0] == event
        assert result[1] == data
    return event, data, len(results)
